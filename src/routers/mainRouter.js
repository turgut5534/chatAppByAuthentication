const express = require('express')
const router = new express.Router()
const User = require('../models/User')
const bcrypt = require('bcrypt')
const validateInputs = require('../utils/helper')
const jwt = require('jsonwebtoken')
require('dotenv').config();
const auth = require('../middlewares/auth')
const slugify = require('slugify')
const rs = require('randomstring')
const Room = require('../models/Room')
const Message = require('../models/Message')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const roomData = []

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/users'); // Specify the destination folder
    },
    filename: function (req, file, cb) {
        // Generate a unique filename using Date.now() and the original file extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
      }
  });
  
  // Initialize Multer upload instance
  const upload = multer({ storage: storage });

router.get('/', (req,res) => {
    res.render('homepage')
})

router.get('/rooms/:slug', auth, async (req,res) => {
    
    try {

        var isLocked = false;

        // const room= await Room.findOne({where: {slug: req.params.slug}})
        const room= await Room.findOne({
            include : {
                model: User
            },
            where: {
                slug: req.params.slug
            }
        })

        if(!room) {
            return res.redirect('/rooms')
        }

        if(room.password) {

            const roomInfo = roomData.find(info => info.RoomId == room.id && info.UserId == req.user.id)

            if(!roomInfo) {
                isLocked = true
            }

        }

        console.log(roomData)
        const user = await User.findByPk(req.user.id)
        user.room_id = room.id
        await user.save()

        const messages = await Message.findAll({
            where: { RoomId: room.id },
            include: [{ model: User }],
          });

        res.render('chat', {user: req.user, room:room, messages, isLocked, slug:req.params.slug})

    } catch(e) {
        console.log(e)
    }

    
})

router.get('/chat', (req,res) => {
    res.render('chat')
})

router.post('/check-password', auth, async(req,res) => {

    try{
        
        const {password, selectedRoom} = req.body

        const room = await Room.findOne({where: {slug:selectedRoom}})

        if(!room) {
            return res.status(404).send({message: 'The room not found. Please refresh the page'})
        }

        const passwordMatch = await bcrypt.compare(password, room.password)

        if(!passwordMatch) {
            return res.status(404).send({message: 'Incorrect password'})
        }

        const roomInfo = {
            RoomId: room.id,
            UserId : req.user.id
        }

        const existingRoomData = roomData.some(info => info.RoomId == room.id && info.UserId == req.user.id )

        if (!existingRoomData) {
            roomData.push(roomInfo)
        }

        res.status(200).send()

    }catch(e) {
        console.log(e)
    }

})

router.get('/rooms', auth, async (req,res) => {

    try {

        const rooms = await Room.findAll({
            include: {model:User}
        });

        res.render('rooms', {rooms, user:req.user})

    } catch(e) {
        console.log(e)
    }   

})

router.post('/rooms/add' , auth, async (req,res) => {
    
    try {

        const {name,password} = req.body
        const roomExists = await Room.findOne({where: {name}})

        if(roomExists) {
            return res.status(401).send({message: 'This room is already exists'})
        }

        const roomForUser = await Room.findAll({where: {UserId:req.user.id}})

        if(roomForUser.length >=3 ) {
            return res.status(401).send({message: 'You can not create more than 3 rooms'})
        }
    
        const newRoom = new Room({
            name: name,
            slug: rs.generate(20),
            UserId: req.user.id
        })
        
        if(password) {
            const hashedPassword = await bcrypt.hash(password,10)
            newRoom.password = hashedPassword
        }

        await newRoom.save()
    
        res.status(201).send(newRoom)

    } catch(e) {
        console.log(e)
    }


})

router.delete('/rooms/delete', auth, async(req,res) => {

    try {

        const room = await Room.findByPk(req.body.roomId, {
            include: {
                model: User
            }
        })

        if(!room || room.User.id != req.user.id) {
            return res.status(404).send({message: 'Room could not be found'})
        }

        const messagesOfTheRoom = await Message.findAll({
            where: {
                RoomId: room.id
            }
        })

        if(messagesOfTheRoom.length > 0) {
            await Message.destroy({
                where: {
                    RoomId: room.id
                }
            })
        }
        await room.destroy()

        res.status(200).send({message: 'The room was deleted successfully'})

    } catch(e) {
        console.log(e)
    }

})

router.get('/login', (req,res) => {
    
    res.render('login')

})

router.get('/register', (req,res) => {
    
    res.render('register')
    
})

router.post('/register', async (req,res) => {

    try {

        const { firstName, lastName, email, password, repassword } = req.body
        const existingUser = await User.findOne({where: {email}})

        if (password != repassword) {
            return res.status(401).json({message: "Password not match"})
        }
        
        if(!validateInputs([firstName, lastName, email, password, repassword])) {
            return res.status(409).json({message: "Please fill up all fields"})
        }

        if(existingUser) {
            return res.status(409).json({message: "This user is already registered"})
        }

        const newUser = new User(req.body)
        newUser.password = await bcrypt.hash(password, 10)
        await newUser.save()

        res.status(201).json({message: "You are successfuly registered"})
    
    } catch(e) {
        console.log(e)
    }

})

router.post('/login', async (req,res) => {

    const {email,password} = req.body

    const userExist = await User.findOne({where: {email}})

    if(!userExist) {
        return res.status(400).json({message: "User with this email not exists"})
    }

    const passwordMatch = await bcrypt.compare(password, userExist.password)

    console.log(passwordMatch)
    if(!passwordMatch) {
        return res.status(401).json({message: "Incorrect email or password"})
    }

    const token = jwt.sign({userId: userExist.id}, process.env.SECRET_KEY, {expiresIn: '12h'})

    res.cookie('token', token, {httpOnly:true})

    res.status(200).json({message: 'Successful'})
})

router.get('/profile', auth,  (req,res) => {

    res.render('profile', {
        user: req.user
    })

})


router.post('/profile/save', auth, async(req,res) => {

    try {

        const {firstName, lastName, email, password, repassword } = req.body

        const user = await User.findByPk(req.user.id)

        if(password) {

            if(password != repassword) {
                return res.status(401).send({message: 'Your password does not match'})
            }

            const hashedPassword = await bcrypt.hash(password, 10)
            user.password = hashedPassword
            await user.save()

        }

        user.firstName = firstName
        user.lastName = lastName
        user.email = email

        await user.save()
    
        res.status(200).send(user)

    } catch(e) {
        console.log(e)
    }

})

router.post('/profile/image/upload', auth, upload.single('image'),  async (req,res) => {

    try {

        const user = await User.findByPk(req.user.id)

        if(user.photo) {

            const photoPath = path.join(__dirname, '../../uploads/users', user.photo);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath); 
            } else {
                console.log('File does not exist on the system:', user.photo);
            }
            
        }
        
        user.photo = req.file.filename

        await user.save()

        res.status(201).send(user)

    } catch(e) {

    }

})

router.get('/logout', (req,res) => {

    res.cookie('token', '', {expries: new Date(0)})
    res.redirect('/login')

})

module.exports = router