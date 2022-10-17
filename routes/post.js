const router = require('express').Router()
const { body } = require('express-validator')
const { createPost, deletePost, sharePost, commentPost, likePost, getPost, deleteComment, unlikePost, unsharePost, updatePost, replyPost } = require('../controllers/post')

//come back after group
router.post('/createpost',
    body('content', 'provide a non empty post.').
        trim().
        notEmpty()
    , createPost)

router.delete('/deletepost',
    body('id', 'Provide a valid post id').
        trim().
        notEmpty().
        isNumeric(),
    deletePost)

router.post('/sharepost',
    body('id', 'Provide a valid post id').
        trim().
        notEmpty().
        isNumeric(),
    sharePost)

router.post('/commentpost',
    body('id', 'Provide a valid post id').
        trim().
        notEmpty().
        isNumeric(),
    body('comment', "Provide a valid Comment")
        .trim()
        .notEmpty()
    ,
    commentPost)

router.post('/replypost',
    body('id', 'Provide a valid comment id').
        trim().
        notEmpty().
        isNumeric(),
    body('reply', "Provide a valid reply")
        .trim()
        .notEmpty(),
    replyPost)

router.post('/likepost',
    body('id', 'Provide a valid post id').
        trim().
        notEmpty().
        isNumeric(),
    likePost)

router.delete('/deletecomment',
    body('id', 'Provide a valid comment id').
        trim().
        notEmpty().
        isNumeric(),
    deleteComment)

router.delete('/unlikepost',
    body('id', 'Provide a valid post id').
        trim().
        notEmpty().
        isNumeric(),
    unlikePost)

router.delete('/unsharepost',
    body('id', 'Provide a valid shared post id').
        trim().
        notEmpty().
        isNumeric(),

    unsharePost)

router.put('/updatepost',
    body('id', 'Provide a valid post id').
        trim().
        notEmpty().
        isNumeric(),
    body('content').trim().notEmpty(),
    updatePost)

router.get('/:post', getPost)


module.exports = router