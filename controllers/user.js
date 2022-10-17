const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const Post = require("../model/post");
const User = require("../model/user");
const block = require("../model/util/block");
const friend = require("../model/util/friend");
const friendReq = require("../model/util/friendReq");

exports.deleteFriend = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const emailUser = req.user.email
    const deletedEmail = req.body.email
    if (emailUser === deletedEmail) {
        return res.status(401).json({ msg: "Bad Input." })
    }
    await friend.destroy({
        where: {
            [Op.or]: [{ friend: emailUser, friendTo: deletedEmail }, { friend: deletedEmail, friendTo: emailUser }]
        }
    }).then(result => {
        res.status(200).json({ msg: 'done' })
    }).catch(err => {
        next(err)
    })
    // console.log(deleteFriendship);
}

exports.blockUser = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const emailUser = req.user.email;
    const blockedEmail = req.body.email;

    if (blockedEmail === emailUser) {
        return res.status(400).json({ msg: "Use a different email from yours." })
    }

    const user = await User.findOne({ where: { email: blockedEmail } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!user) {
        return res.status(400).json({ msg: "Wrong user." })
    }
    await friend.destroy({
        where: {
            [Op.or]: [{ friend: emailUser, friendTo: blockedEmail }, { friend: blockedEmail, friendTo: emailUser }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    await friendReq.destroy({
        where: {
            [Op.or]: [{ from: emailUser, to: blockedEmail }, { from: blockedEmail, to: emailUser }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    await block.findOrCreate({
        where:
        {
            [Op.or]: [{ block: emailUser, blockTo: blockedEmail }, { block: blockedEmail, blockTo: emailUser }]
        },
        defaults: {
            block: emailUser, blockTo: blockedEmail
        }
    }).then(result => {
        res.status(200).json({ msg: "Blocked." })
    }).catch(err => next(err));

}

exports.unblockUser = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const emailUser = req.user.email
    const blockedEmail = req.body.email
    await block.destroy({
        where: {
            block: emailUser, blockTo: blockedEmail
        }
    }).then(result => {
        res.status(200).json({ msg: 'done' })
    }).catch(err => {
        next(err)
    })
}

exports.updateMe = async (req, res, next) => {
    let e = false
    const email = req.user.email;
    const user = await User.findOne({ where: { email } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }

    if (req.body?.name) {
        user.name = req.body.name
    }
    if (req.body?.bio) {
        user.bio = req.body.bio
    }
    try {
        if (req.body?.image) {
            req.body.image = new URL(req.body.image)
            user.image = req.body.image.href
        }
    }
    catch (err) {
    }
    await user.save().then(result => {
        res.status(201).json({ msg: 'updated' })
    }).catch(err => next(err))

}

exports.showMe = async (req, res, next) => {
    let e = false
    const user = await User.findOne({ where: { email: req.user.email } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    res.status(200).json({
        msg: 'Done', data: {
            name: user?.name,
            image: user?.image,
            email: user?.email,
            bio: user?.bio,
            createdAt: user?.createdAt
        }
    })
}

exports.deleteMe = async (req, res, next) => {
    let e = false
    await User.destroy({ where: { email: req.user.email } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    res.status(201).json({ msg: "deleted" })
}

exports.sendFriendReq = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }

    const emailUser = req.user.email;
    const requestedEmail = req.body.email;

    if (requestedEmail === emailUser) {
        return res.status(400).json({ msg: "Use a different email from yours." })
    }

    const user = await User.findOne({ where: { email: requestedEmail } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!user) {
        return res.status(400).json({ msg: "Wrong user." })
    }

    const prevReqFromTheOtherEmail = await friendReq.findOne({ where: { to: emailUser, from: requestedEmail } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (prevReqFromTheOtherEmail) {
        return res.status(400).json({ msg: "The other user already requested You, accept his request." })
    }

    const areTheyFriends = await friend.findOne({
        where:
        {
            [Op.or]: [{ friend: emailUser, friendTo: requestedEmail }, { friend: requestedEmail, friendTo: emailUser }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (areTheyFriends) {
        return res.status(400).json({ msg: "You're already friends." })
    }

    const areTheyBlocked = await block.findOne({
        where:
        {
            [Op.or]: [{ block: emailUser, blockTo: requestedEmail }, { block: requestedEmail, blockTo: emailUser }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (areTheyBlocked) {
        return res.status(400).json({ msg: "Someone of you blocked the other, the request failed." })
    }

    await friendReq.findOrCreate({
        where:
        {
            [Op.or]: [{ from: emailUser, to: requestedEmail }, { from: requestedEmail, to: emailUser }]
        },
        defaults: {
            from: emailUser, to: requestedEmail
        }
    }).then(result => {
        res.status(200).json({ msg: "Request has been sent." })
    }).catch(err => next(err));
}

exports.deleteFriendReq = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const emailUser = req.user.email;
    const requestedEmail = req.body.email;

    if (requestedEmail === emailUser) {
        return res.status(400).json({ msg: "Use a different email from yours." })
    }
    await friendReq.destroy({
        where: {
            [Op.or]: [{ from: emailUser, to: requestedEmail }, { from: requestedEmail, to: emailUser }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    return res.status(201).json({ msg: 'Request has been deleted.' })
}

exports.acceptFriendReq = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const emailUser = req.user.email;
    const requestedEmail = req.body.email;

    if (requestedEmail === emailUser) {
        return res.status(400).json({ msg: "Use a different email from yours." })
    }
    const friendRequest = await friendReq.findOne({ where: { from: requestedEmail, to: emailUser } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!friendRequest) {
        return res.status(400).json({ msg: "There's no request to accept." })
    }
    await friendRequest.destroy().catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }

    await friend.findOrCreate({
        where: { friend: requestedEmail, friendTo: emailUser },
        defaults: {
            friend: emailUser, friendTo: requestedEmail
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    return res.status(201).json({ msg: "Accepted the friend request" })

}

exports.showUser = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }

    const user = await User.findOne({ where: { email: req.body.email } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!user) {
        return res.status(404).json({ msg: "User not found." })
    }
    res.status(200).json({
        msg: "User Found.", data: {
            name: user.name,
            image: user.image,
            bio: user.bio,
            email: user.email
        }
    })
}

exports.getUserPosts = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const areTheyBlockedEachOther = await block.findOne({
        where: {
            [Op.or]: [{ block: req.body.email, blockTo: req.user.email }, { blockTo: req.body.email, block: req.user.email }]
        }
    }).catch(err => {
        e = true
        next(err)
    })
    if (e) {
        return
    }
    if (areTheyBlockedEachOther) {
        const err = new Error("You and the other user are blocked.")
        err.statusCode = 401
        return next(err)
    }
    const user = await User.findOne({ where: { email: req.body.email } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!user) {
        return res.status(404).json({ msg: "User not found." })
    }
    const posts = await Post.findAll({ where: { userEmail: req.body.email } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (posts.length === 0) {
        return res.status(404).json({ msg: "No posts found." })
    }
    // const sharedPosts = await share.findAll({where:{userEmail:req.body.email}})

    res.json(200).json({
        msg: "Posts Found.", data: {
            posts,
            sharedPosts
        }
    })
}

