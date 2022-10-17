const Sequelize = require('sequelize')
const sequelize = require('../../util/database')

const share = sequelize.define('share', {
    caption: Sequelize.TEXT,
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userEmail: {
        type: Sequelize.STRING,
        // references: 'users' // <<< Note, its table's name, not object name
        // ,
        // referencesKey: 'email' // <<< Note, its a column name
        unique: false,
        references: {
            model: 'users'// <<< Note, its table's name, not object name
            ,
            key: 'email' // <<< Note, its a column name
        }
        , unique: false
    },
    postId: {
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
    }
})

module.exports = share