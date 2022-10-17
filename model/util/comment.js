const Sequelize = require('sequelize')

const sequelize = require('../../util/database')

const comment = sequelize.define('comment', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
        autoIncrement: true,
    },
    comment: {
        type: Sequelize.TEXT,
        allowNull: false
    }, postId: {
        type: Sequelize.INTEGER,
        // references: 'posts' 
        // ,
        // referencesKey: 'id' 
        unique: false,
        references: {
            model: 'posts'// <<< Note, its table's name, not object name
            ,
            key: 'id' // <<< Note, its a column name
        }
    },
    userEmail: {
        type: Sequelize.STRING,
        // references: 'posts' 
        // ,
        // referencesKey: 'id' 
        unique: false,
        references: {
            model: 'users'// <<< Note, its table's name, not object name
            ,
            key: 'email' // <<< Note, its a column name
        }
    },
    media: Sequelize.STRING,
})

module.exports = comment