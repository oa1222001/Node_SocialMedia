require('dotenv').config();
const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_NAME.toString(), process.env.DATABASE_USERNAME.toString(), process.env.DATABASE_PASSWORD.toString(), {
    dialect: 'mysql',
    host: process.env.HOST,
    logging: false
})

module.exports = sequelize