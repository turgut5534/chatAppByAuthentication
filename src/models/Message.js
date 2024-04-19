const { DataTypes } = require('sequelize');
const sequelize = require('../db/mysql'); // Assuming you have sequelize.js file for configuring Sequelize

const Message = sequelize.define('Message', {
 
    text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    file: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

sequelize.sync()

module.exports = Message;
