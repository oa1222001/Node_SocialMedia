const router = require('express').Router()
const { createGroup, deleteGroup, makeAdmin, deleteAdmin, acceptUser, refuseUser, userJoinReq, userLeave, blockUser, unblockUser, deleteUser, addUser, updateGroup, getGroup, getGroupPosts } = require('../controllers/group')
const { body } = require('express-validator')

router.post('/creategroup',
    body('name', 'Provide Alphanumeric name with length at least 3 and maximum 100.')
        .trim()
        .isLength({ min: 3, max: 100 })
        .isAlphanumeric()
    ,
    body('desc', 'Provide desc with length at least 10 and maximum 255.')
        .trim()
        .isLength({ min: 10, max: 255 })
    ,
    body('image', 'Provide image Url.')
        .trim()
        .isURL()
    ,
    createGroup)

router.delete('/deletegroup',
    body('groupId', 'Provide group Id.')
        .trim()
        .notEmpty()
    , deleteGroup)

router.post('/makeadmin',
    body('email', "Provide a valid email.")
        .trim()
        .isEmail()
        .normalizeEmail(),
    body('groupId', 'Provide group Id.')
        .trim()
        .notEmpty()
    , makeAdmin)

router.delete('/deleteadmin',
    body('email', "Provide a valid email.")
        .trim()
        .isEmail()
        .normalizeEmail(),
    body('groupId', 'Provide group Id.')
        .trim()
        .notEmpty(),
    deleteAdmin)

router.post('/userjoinreq',
    body('groupId', 'Provide group Id.')
        .trim()
        .notEmpty(),
    userJoinReq)

router.post('/acceptuser',
    body('email', "Provide a valid email.")
        .trim()
        .isEmail()
        .normalizeEmail(),
    body('groupId', 'Provide group Id.')
        .trim()
        .notEmpty(),
    acceptUser)

router.post('/refuseuser',
    body('email', "Provide a valid email.")
        .trim()
        .isEmail()
        .normalizeEmail(),
    body('groupId', 'Provide group Id.')
        .trim()
        .notEmpty(),
    refuseUser)

router.delete('/userleave',
    body('groupId', 'Provide group Id.')
        .trim()
        .notEmpty(),
    userLeave)

router.post('/blockuser',
    body('email', "Provide a valid email.")
        .trim()
        .isEmail()
        .normalizeEmail(),
    body('groupId', 'Provide group Id.')
        .trim()
        .notEmpty(),
    blockUser)

router.post('/unblockuser', body('email', "Provide a valid email.")
    .trim()
    .isEmail()
    .normalizeEmail(),
    body('groupId', 'Provide group Id.')
        .trim()
        .notEmpty(),
    unblockUser)

router.delete('/deleteuser',
    body('email', "Provide a valid email.")
        .trim()
        .isEmail()
        .normalizeEmail(),
    body('groupId', 'Provide group Id.')
        .trim()
        .notEmpty(),
    deleteUser)

router.put('/updategroup',
    body('groupId', 'Provide group Id.')
        .trim()
        .notEmpty(),
    updateGroup)

router.get('/getgroupposts/:group', getGroupPosts)

router.get('/:group', getGroup)


module.exports = router