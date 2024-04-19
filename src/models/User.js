const { DataTypes } = require('sequelize');
const sequelize = require('../db/mysql'); // Assuming you have sequelize.js file for configuring Sequelize
const Message = require('./Message')
const Room = require('./Room')

const User = sequelize.define('User', {
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true 
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    photo: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

User.hasMany(Message)
Message.belongsTo(User)

User.hasMany(Room)
Room.belongsTo(User)

sequelize.sync()

module.exports = User;
