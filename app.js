const express = require('express')
const dotenv = require('dotenv')
const helmet = require('helmet')
const cors = require('cors')
const xss = require('xss-clean')
const rateLimiter = require('express-rate-limit')

const sequelize = require('./util/database')
const association = require('./util/association')
const errorHandlerMiddleware = require('./middleware/error-handler')
const auth = require('./middleware/auth')

const authRouter = require('./routes/auth')
const userRouter = require('./routes/user')
const postRouter = require('./routes/post')
const groupRouter = require('./routes/group')

dotenv.config()

const app = express()

app.use(express.json())


app.set('trust proxy', 1);

app.use(rateLimiter({
    windowMs: 60 * 1000, //1 Min
    max: 1000 // 1000 requests
}))

// Security Middlwares
app.use(cors())
app.use(helmet())
app.use(xss())

app.use('/auth', authRouter)
app.use('/user', auth, userRouter)
app.use('/post', auth, postRouter)
app.use('/group', auth, groupRouter)

app.use((req, res, next) => res.status(404).send('Route does not exist'))


app.use(errorHandlerMiddleware)

association()

sequelize.sync({ alter: true }).then(res => {
    app.listen(process.env.PORT, () => {
        console.log('running');
    })


}).catch(err => console.log(err))
