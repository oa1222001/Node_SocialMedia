const Sequelize = require('sequelize')

const sequelize = require('../util/database')

const User = sequelize.define('user', {
    email: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
    password: {

        type: Sequelize.STRING,
        allowNull: false

    },
    image: Sequelize.STRING,
    bio: Sequelize.STRING,
    verifyCode: Sequelize.STRING

})

module.exports = User