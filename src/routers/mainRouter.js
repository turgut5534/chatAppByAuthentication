const express = require('express')
const router = new express.Router()
const User = require('../models/User')
const bcrypt = require('bcrypt')
const validateInputs = require('../utils/helper')
const jwt = require('jsonwebtoken')
require('dotenv').config();
const auth = require('../middlewares/auth')

router.get('/', auth, (req,res) => {
    
    user = req.user

    res.render('index', {user})
    
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