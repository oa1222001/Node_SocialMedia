const { getUserPosts, acceptFriendReq, blockUser, deleteFriend, deleteFriendReq, deleteMe, sendFriendReq, showMe, showUser, unblockUser, updateMe } = require('../controllers/user');
const { body } = require('express-validator');

const router = require('express').Router();

router.delete('/deletefriend',
    body('email', 'Provide a valid Email.')
        .trim()
        .isEmail()
        .normalizeEmail(),
    deleteFriend)

router.post('/blockuser',
    body('email', 'Provide a valid Email.')
        .trim()
        .isEmail()
        .normalizeEmail(),

    blockUser)

router.post('/unblockuser',
    body('email', 'Provide a valid Email.')
        .trim()
        .isEmail()
        .normalizeEmail()
    ,
    unblockUser)

router.put('/updateme',
    updateMe)

router.get('/showme',
    showMe)

router.delete('/deleteme',
    deleteMe)

router.post('/sendfriendreq',
    body('email', 'Provide a valid Email.')
        .trim()
        .isEmail()
        .normalizeEmail(),
    sendFriendReq)

router.delete('/deletefriendreq',
    body('email', 'Provide a valid Email.')
        .trim()
        .isEmail()
        .normalizeEmail(),
    deleteFriendReq)

router.post('/acceptfriendreq',
    body('email', 'Provide a valid Email.')
        .trim()
        .isEmail()
        .normalizeEmail(),
    acceptFriendReq)



// come back after posts
router.get('/getuserposts', getUserPosts)

router.get('/getuser',
    body('email', 'Provide a valid Email.')
        .trim()
        .isEmail()
        .normalizeEmail(),
    showUser)

module.exports = router