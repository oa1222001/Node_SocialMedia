const jwt = require('jsonwebtoken')
// const UnauthenticatedError = require('../errors/unauthenticated')

const auth = async (req, res, next) => {
    // check header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        const err = new Error('Authentication invalid')
        err.statusCode = 401;
        return next(err)
    }
    const token = authHeader.split(' ')[1]

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        // attach the user to the job routes
        req.user = { name: payload.name, email: payload.email }
        return next()
    } catch (error) {
        const err = new Error('Authentication invalid')
        err.statusCode = 401;
        return next(err)
    }
}

module.exports = auth
