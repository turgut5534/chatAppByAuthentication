const { DataTypes } = require('sequelize');
const sequelize = require('../db/mysql'); // Assuming you have sequelize.js file for configuring Sequelize

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
    }
});

// sequelize.sync()

module.exports = User;
