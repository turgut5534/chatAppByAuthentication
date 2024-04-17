const { DataTypes } = require('sequelize');
const sequelize = require('../db/mysql'); // Assuming you have sequelize.js file for configuring Sequelize
const Message = require('./Message')

const Room = sequelize.define('Room', {
 
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    password: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

Room.hasMany(Message)
Message.belongsTo(Room);

module.exports = Room;
