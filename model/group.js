const Sequelize = require('sequelize')
const sequelize = require('../util/database')

const Group = sequelize.define('group', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
        autoIncrement: true,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    image: {
        type: Sequelize.STRING,
        allowNull: false
    },
    desc: {
        type: Sequelize.STRING,
        allowNull: false
    },
})

module.exports = Group