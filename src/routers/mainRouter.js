const express = require('express')
const router = new express.Router()
const User = require('../models/User')
const bcrypt = require('bcrypt')
const validateInputs = require('../utils/helper')
const jwt = require('jsonwebtoken')
require('dotenv').config();
const auth = require('../middlewares/auth')
const slugify = require('slugify')
const Room = require('../models/Room')
const Message = require('../models/Message')

router.get('/rooms/:name', auth, async (req,res) => {
    
    try {

        const room= await Room.findOne({where: {name: req.params.name}})

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

router.get('/rooms', auth, async (req,res) => {

    try {

        const rooms = await Room.findAll();

        res.render('rooms', {rooms})

    } catch(e) {
        console.log(e)
    }   

})

router.get('/rooms/add/:room' , async (req,res) => {
    
    try {
        const roomExists = await Room.findOne({where: {name:req.params.room}})

        if(roomExists) {
            return res.status(401).send({message: 'This room is already exists'})
        }
    
        await Room.create({
            name: req.params.room,
            slug: slugify(req.params.room, {lower: true})
        })
    
        res.redirect('/rooms')

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