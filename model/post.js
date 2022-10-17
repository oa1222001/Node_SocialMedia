const Sequelize = require('sequelize')
const sequelize = require('../util/database')
const Post = sequelize.define('post', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
        autoIncrement: true,
    },
    content: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    media: Sequelize.STRING
})

module.exports = Post