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


router.get('/', (req,res) => {
    res.render('homepage')
})

router.get('/rooms/:slug', auth, async (req,res) => {
    
    try {

        const room= await Room.findOne({where: {slug: req.params.slug}})

        if(!room) {
            return res.redirect('/rooms')
        }
        const user = await User.findByPk(req.user.id)
        user.room_id = room.id
        await user.save()

        const messages = await Message.findAll({
            where: { RoomId: room.id },
            include: [{ model: User }],
          });


        res.render('index', {user: req.user, room:room.id, messages})

    } catch(e) {
        console.log(e)
    }

    
})

router.post('/check-password', async(req,res) => {

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

        res.render('rooms', {rooms})

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

    const token = jwt.sign({userId: userExist.id}, process.env.SECRET_KEY, {expiresIn: '1h'})

    res.cookie('token', token, {httpOnly:true})

    res.status(200).json({message: 'Successful'})
})

router.get('/logout', (req,res) => {

    res.cookie('token', '', {expries: new Date(0)})
    res.redirect('/login')

})

module.exports = router