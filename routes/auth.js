const { signUp, login, verifySignUp, forgotPass, verifyPassReset } = require('../controllers/auth');
const { body } = require('express-validator');

const router = require('express').Router();

router.post('/signup',
    body('password', 'Password must be Alphanumeric between 8 and 100 characters.')
        .trim()
        .isAlphanumeric()
        .isLength({ min: 8, max: 100 })
    ,
    body('email', 'Provide a valid Email.')
        .trim()
        .isEmail()
        .normalizeEmail(),
    body('name')
        .trim()
        .not()
        .isEmpty()

    ,
    signUp)


router.post('/login',
    body('password', 'Password must be Alphanumeric between 8 and 100 characters.')
        .trim()
        .isAlphanumeric()
        .isLength({ min: 8, max: 100 })
    ,
    body('email', 'Provide a valid Email.')
        .trim()
        .isEmail()
        .normalizeEmail()
    , login)

router.get('/verification/:token', verifySignUp)

router.post('/forgotPass', body('email', 'Provide a valid Email.')
    .trim()
    .isEmail()
    .normalizeEmail(), forgotPass)

router.post('/resetpass/:token', body('password', 'Password must be Alphanumeric between 8 and 100 characters.')
    .trim()
    .isAlphanumeric()
    .isLength({ min: 8, max: 100 }), verifyPassReset)

module.exports = router