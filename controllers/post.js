const { validationResult } = require("express-validator");
// const { Op } = require("sequelize");
const Group = require("../model/group");
const Post = require("../model/post");
const comment = require("../model/util/comment");
const joingroup = require("../model/util/joingroup");
const like = require("../model/util/like");
const reply = require("../model/util/reply");
const share = require("../model/util/share");

exports.createPost = async (req, res, next) => {
    let e = false
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    if (req.body?.groupId) {
        const isGroupExisted = await Group.findOne({ where: { id: req.body.groupId } }).catch(err => {
            e = true;
            next(err)
        })
        if (e) {
            return
        }
        if (!isGroupExisted) {
            return res.status(404).json({ msg: "The group you are trying to post in doesn't exist." })
        }
        const isUserInGroup = await joingroup.findOne({
            where: {
                userEmail: req.user.email,
                groupId: req.body.groupId
            }
        }).catch(err => {
            e = true;
            next(err)
        })
        if (e) {
            return
        }
        if (!isUserInGroup) {
            return res.status(401).json({ msg: "You're not authorized to post in this group." })
        }
    }

    try {
        if (req.body?.media) {
            req.body.media = new URL(req.body.media)
            req.body.media = req.body.media.href
        }
    }
    catch (err) {
        req.body.media = null
    }
    await Post.create({
        content: req.body.content,
        media: req.body?.media,
        userEmail: req.user.email,
        groupId: req.body?.groupId
    }).then(r => {
        res.status(201).json({ msg: "your post has been created." })
    }).catch(err => next(err))

}

exports.deletePost = async (req, res, next) => {
    let e = false
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const isPostExist = await Post.findOne({ where: { id: req.body.id } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!isPostExist) {
        return res.status(404).json({ msg: 'post not found.' })
    }
    if (isPostExist.userEmail.toString() !== req.user.email) {
        return res.status(401).json({ msg: "You are not authorized to delete this post." })
    }
    await isPostExist.destroy().then(r => {
        res.status(201).json({ msg: "Post deleted." })
    })
        .catch(err => next(err))

}

exports.sharePost = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }

    const isPostExist = await Post.findOne({ where: { id: req.body.id } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!isPostExist) {
        return res.status(404).json({ msg: 'post not found.' })
    }

    await share.create({
        userEmail: req.user.email,
        postId: isPostExist.id,
        caption: req.body?.caption,
    }).then(r => res.status(201).json({ msg: "Post has been shared." })).catch(err => next(err))
}

exports.commentPost = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    try {
        if (req.body?.media) {
            req.body.media = new URL(req.body.media)
            req.body.media = req.body.media.href
        }
    }
    catch (err) {
        req.body.media = null
    }
    const isPostExist = await Post.findOne({ where: { id: req.body.id } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!isPostExist) {
        return res.status(404).json({ msg: 'post not found.' })
    }
    await comment.create({
        comment: req.body.comment,
        media: req.body?.media,
        userEmail: req.user.email,
        postId: req.body.id
    }).then(re => res.status(201).json({ msg: "Comment Created." })).catch(err => next(err))
}

exports.replyPost = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    try {
        if (req.body?.media) {
            req.body.media = new URL(req.body.media)
            req.body.media = req.body.media.href
        }
    }
    catch (err) {
        req.body.media = null
    }
    const isCommentExist = await comment.findOne({ where: { id: req.body.id } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!isCommentExist) {
        return res.status(404).json({ msg: 'comment not found.' })
    }
    const rep = await comment.create({
        comment: req.body.comment,
        media: req.body?.media,
        userEmail: req.user.email,
        postId: isCommentExist.postId
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }

    await reply.create({
        reply: rep.id,
        replyTo: isCommentExist.id
    }).then(re => res.status(201).json({ msg: "Reply Created." })).catch(err => next(err))
}

exports.likePost = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const isPostExist = await Post.findOne({ where: { id: req.body.id } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!isPostExist) {
        return res.status(404).json({ msg: 'post not found.' })
    }
    await like.findOrCreate({
        where: {
            userEmail: req.user.email,
            postId: req.body.id
        },
        defaults: {
            userEmail: req.user.email,
            postId: req.body.id
        }
    }).then(re => res.status(201).json({ msg: "Liked the post." })).catch(e => next(e))

}

exports.getPost = async (req, res, next) => {
    let e = false
    const id = req.params.post;
    const p = await Post.findOne({ where: { id } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!p) {
        return res.status(404).json({ msg: "Post not found." })
    }
    return res.status(200).json({ msg: "Post found.", data: p })
}

exports.deleteComment = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const isCommentExist = await comment.findOne({ where: { id: req.body.id, userEmail: req.user.email } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!isCommentExist) {
        return res.status(404).json({ msg: 'comment not found.' })
    }
    // if (isCommentExist.userEmail.toString() !== req.user.email) {
    //     return res.status(401).json({ msg: 'Unauthorized to delete a comment.' })
    // }
    await isCommentExist.destroy().then(r => res.status(201).json({ msg: "deleted" })).catch(e => next(e))
}

exports.unlikePost = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const isLikeExist = await like.findOne({ where: { postId: req.body.id, userEmail: req.user.email } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!isLikeExist) {
        return res.status(404).json({ msg: 'like not found.' })
    }
    await isLikeExist.destroy().then(r => res.status(201).json({ msg: "deleted" })).catch(e => next(e))
}

exports.unsharePost = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const isShareExist = await share.findOne({ where: { id: req.body.id, userEmail: req.user.email } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!isShareExist) {
        return res.status(404).json({ msg: 'share not found.' })
    }
    await isShareExist.destroy().then(r => res.status(201).json({ msg: "deleted" })).catch(e => next(e))
}

exports.updatePost = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const isPostExist = await Post.findOne({ where: { id: req.body.id, userEmail: req.user.email } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!isPostExist) {
        return res.status(404).json({ msg: 'post not found.' })
    }

    try {
        if (req.body?.media) {
            req.body.media = new URL(req.body.media)
            isPostExist.media = req.body.media.href
        }
    }
    catch (err) {
    }
    isPostExist.content = req.body.content
    await isPostExist.save().then(re => res.status(201).json({ msg: "Updated." })).catch(err => next(err))
}