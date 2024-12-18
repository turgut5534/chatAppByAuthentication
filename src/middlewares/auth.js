const jwt = require('jsonwebtoken')
const User = require('../models/User')

const auth = async (req,res,next) => {

    try {

        const token = req.cookies.token

        if(!token) {
            throw new Error('No token found')
        }
    
        const decoded = await jwt.verify(token, process.env.SECRET_KEY)
        const userId = decoded.userId
    
        const user = await User.findByPk(userId)

        if(!user) {
            return res.redirect('/login')
        }
    
        req.user = user

        if (req.app.get('io')) {
            req.app.get('io').use((socket, next) => {
                socket.user = user;
                next();
            });
        }
    
        next()

    } catch(e) {
        console.log(e)
        res.redirect('/chatapp/login')
    }

}

module.exports = auth