const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const Group = require("../model/group");
const admin = require("../model/util/admin");
const joingroup = require("../model/util/joingroup");
const joingroupreq = require("../model/util/joingroupreq");
const User = require("../model/user");
const groupBlock = require("../model/util/groupBlock");
const joinGroupReq = require("../model/util/joingroupreq");
const Post = require("../model/post");

exports.createGroup = async (req, res, next) => {
    let e = false
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    try {
        const group = await Group.create({
            name: req.body.name,
            image: req.body.image,
            desc: req.body.desc,
            creator: req.user.email
        }).catch(err => {
            e = true;
            next(err)
        })
        if (e) {
            return
        }

        await admin.create({
            userEmail: req.user.email,
            groupId: group.id
        }).catch(err => {
            e = true;
            next(err)
        })
        if (e) {
            return
        }
        await joingroup.create(
            {
                userEmail: req.user.email,
                groupId: group.id
            }
        ).catch(err => {
            e = true;
            next(err)
        })
        if (e) {
            return
        }
        res.status(201).json({ msg: "Group Created.", groupId: group.id })

    } catch (error) {
        next(error)
    }
}

exports.deleteGroup = async (req, res, next) => {
    const errors = validationResult(req)
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const isAdmin = await admin.findOne({
        where: {
            [Op.and]: [{ userEmail: req.user.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }

    if (isAdmin) {
        await Group.destroy({ where: { id: req.body.groupId } }).then(result => {
            res.status(201).json({ msg: "Deleted." })
        }).catch(err => {
            e = true;
            next(err)
        })
        if (e) {
            return
        }
    }
    else {
        return res.status(400).json({ msg: "You are not admin of this group." })
    }
}

exports.makeAdmin = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const isAdmin = await admin.findOne({
        where: {
            [Op.and]: [{ userEmail: req.user.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }

    if (!isAdmin) {
        return res.status(401).json({ msg: "You're not authorized to access this endpoint." })
    }

    const isUserExist = await User.findOne({ where: { email: req.body.email } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!isUserExist) {
        return res.status(404).json({ msg: "The User you want to make admin is not found." })
    }

    const isUserJoined = await joingroup.findOne({ where: { userEmail: req.body.email } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!isUserJoined) {
        return res.status(404).json({ msg: "The User you want to make admin is not in the group." })
    }
    const isAlreadyAdmin = await admin.findOne({
        where: {
            userEmail: req.body.email,
            groupId: req.body.groupId
        }
    }).catch(err => {
        e = true
        next(err)
    })
    if (e) {
        return
    }
    if (isAlreadyAdmin) {
        return res.status(400).json({ msg: "This user is already an admin" })
    }

    try {
        await admin.create({
            userEmail: req.body.email,
            groupId: req.body.groupId
        }).then(r => {
            res.status(201).json({ msg: "User is Admin now." })
        })
            .catch(err => {
                e = true;
                next(err)
            })
        if (e) {
            return
        }
    } catch (error) {
        next(error)
    }

}

exports.deleteAdmin = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const isAdmin = await admin.findOne({
        where: {
            [Op.and]: [{ userEmail: req.user.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }

    if (!isAdmin) {
        return res.status(401).json({ msg: "You're not authorized to access this endpoint." })
    }
    const count = await admin.count({
        where: {
            groupId: req.body.groupId
        }
    }).catch(err => {
        e = true
        return next(err)
    })
    if (e) {
        return
    }
    // if (count <= 1) {
    //     await Group.destroy({
    //         where: {
    //             id: req.body.groupId
    //         }
    //     })
    // }
    const isTheDeletedAdminAnReallyAdmin = await admin.findOne({
        where: {
            userEmail: req.body.email,
            groupId: req.body.groupId
        }
    }).catch(err => {
        e = true;
        return next(err)
    })
    if (e) {
        return
    }
    if (!isTheDeletedAdminAnReallyAdmin) {
        return res.status(400).json({ msg: 'The admin you want to remove is not an admin' })
    }
    if (count <= 1) {
        const user = await joingroup.findOne({
            where: {
                groupId: req.body.groupId,
                userEmail: {
                    [Op.not]: req.body.email
                }
            }
        }).catch(err => {
            e = true
            return next(err)
        })
        if (e) {
            return
        }
        if (user) {
            await admin.findOrCreate(
                {
                    where: {
                        [Op.and]: [{ userEmail: user.userEmail }, { groupId: req.body.groupId }]
                    },
                    defaults: {
                        groupId: req.body.groupId,
                        userEmail: user.userEmail
                    }
                }).catch(err => {
                    e = true
                    return next(err)
                })
            if (e) {
                return
            }
            console.log(count);
        }
        else {
            await Group.destroy({
                where: {
                    id: req.body.groupId
                }
            }).catch(err => {
                e = true
                return next(err)
            })
            if (e) {
                return
            }
        }
    }
    await admin.destroy({
        where: {
            [Op.and]: [{ userEmail: req.body.email }, { groupId: req.body.groupId }]
        }
    }).then(r => {
        res.status(201).json({ msg: "Admin has been removed." })
    }).catch(err => next(err))
}

exports.userJoinReq = async (req, res, next) => {
    let e = false
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const isUserJoined = await joingroup.findOne({
        where: {
            [Op.and]: [{ userEmail: req.user.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }

    if (isUserJoined) {
        return res.status(400).json({ msg: "User Already Joined. " })
    }

    const isUserBlocked = await groupBlock.findOne({
        where: {
            [Op.and]: [{ userEmail: req.user.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }

    if (isUserBlocked) {
        return res.status(400).json({ msg: "User has blocked or been blocked by the group." })
    }

    await joingroupreq.findOrCreate({
        where: {
            [Op.and]: [{ userEmail: req.user.email }, { groupId: req.body.groupId }]
        },
        defaults: {
            groupId: req.body.groupId,
            userEmail: req.user.email
        }
    }).then(r => {
        res.status(201).json({ msg: "Requested to join group." })
    }).catch(err => next(err));
}

exports.acceptUser = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const isAdmin = await admin.findOne({
        where: {
            [Op.and]: [{ userEmail: req.user.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }

    if (!isAdmin) {
        return res.status(401).json({ msg: "You're not authorized to access this endpoint." })
    }
    const userReq = await joingroupreq.findOne({
        where: {
            [Op.and]: [{ userEmail: req.body.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }

    if (!userReq) {
        return res.status(404).json({ msg: "Request is not found to be accepted." })
    }
    await userReq.destroy().catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    await joingroup.create({
        userEmail: req.body.email, groupId: req.body.groupId
    }).then(r => {
        res.status(201).json({ msg: "Accept the join request." })
    })
        .catch(err => next(err))

}

exports.refuseUser = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const isAdmin = await admin.findOne({
        where: {
            [Op.and]: [{ userEmail: req.user.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!isAdmin) {
        return res.status(401).json({ msg: "You're not authorized to access this endpoint." })
    }
    await joingroupreq.destroy({
        where: {
            [Op.and]: [{ userEmail: req.body.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    return res.status(201).json({ msg: "Request deleted." })
}

exports.userLeave = async (req, res, next) => {
    let e = false
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const isUserInGroup = await joingroup.findOne({
        where: {
            userEmail: req.user.email, groupId: req.body.groupId
        }
    }).catch(err => {
        e = true
        return next(err)
    })
    if (e) {
        return
    }

    if (!isUserInGroup) {
        return res.status(404).json({ msg: "User is not in the group" })
    }

    await joingroup.destroy({
        where: {
            [Op.and]: [{ userEmail: req.user.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    await admin.destroy({
        where: {
            [Op.and]: [{ userEmail: req.user.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }

    const usersCount = await joingroup.count({ where: { groupId: req.body.groupId } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (usersCount < 1) {
        await Group.destroy({ where: { id: req.body.groupId } }).catch(err => {
            e = true;
            next(err)
        })
        if (e) {
            return
        }
        return res.status(201).json({ msg: "User Left." })
    }
    const adminCount = await admin.count({
        where: {
            groupId: req.body.groupId
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (adminCount < 1) {
        const user = await joingroup.findOne({
            where: {
                groupId: req.body.groupId, userEmail: {
                    [Op.not]: req.user.email
                }
            }
        }).catch(err => {
            e = true;
            next(err)
        })
        if (e) {
            return
        }
        await admin.findOrCreate({
            where: {
                userEmail: user.userEmail, groupId: user.groupId
            },
            defaults: {
                userEmail: user.userEmail, groupId: user.groupId
            }
        }).catch(err => {
            e = true;
            next(err)
        })
        if (e) {
            return
        }
    }
    return res.status(201).json({ msg: "User Left." })
}

exports.blockUser = async (req, res, next) => {
    let e = false
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const isAdmin = await admin.findOne({
        where: {
            [Op.and]: [{ userEmail: req.user.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!isAdmin) {
        return res.status(401).json({ msg: "You're not authorized to access this endpoint." })
    }
    if (req.user.email === req.body.email) {
        return res.status(400).json({ msg: "You can't block yourself" })
    }
    await joingroup.destroy({
        where: {
            [Op.and]: [{ userEmail: req.body.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    await joinGroupReq.destroy({
        where: {
            [Op.and]: [{ userEmail: req.body.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    await admin.destroy({
        where: {
            [Op.and]: [{ userEmail: req.body.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }

    await groupBlock.findOrCreate({
        where: {
            [Op.and]: [{ userEmail: req.body.email }, { groupId: req.body.groupId }]
        },
        defaults: {
            groupId: req.body.groupId,
            userEmail: req.user.email
        }
    }).then(r => {
        res.status(201).json({ msg: "User has been blocked from the group." })
    }).catch(err => next(err))


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
    const isAdmin = await admin.findOne({
        where: {
            [Op.and]: [{ userEmail: req.user.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!isAdmin) {
        return res.status(401).json({ msg: "You're not authorized to access this endpoint." })
    }
    await groupBlock.destroy({
        where: {
            [Op.and]: [{ userEmail: req.body.email }, { groupId: req.body.groupId }]
        }
    }).then(r => {
        res.status(200).json({ msg: 'user has been unblocked from the group.' })
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
}

exports.deleteUser = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const isAdmin = await admin.findOne({
        where: {
            [Op.and]: [{ userEmail: req.user.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!isAdmin) {
        return res.status(401).json({ msg: "You're not authorized to access this endpoint." })
    }
    await joingroup.destroy({
        where: {
            [Op.and]: [{ userEmail: req.body.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    await admin.destroy({
        where: {
            [Op.and]: [{ userEmail: req.body.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    return res.status(201).json({ msg: "User deleted from group." })
}

exports.updateGroup = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const isAdmin = await admin.findOne({
        where: {
            [Op.and]: [{ userEmail: req.user.email }, { groupId: req.body.groupId }]
        }
    }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!isAdmin) {
        return res.status(401).json({ msg: "You're not authorized to access this endpoint." })
    }
    const group = await Group.findOne({ where: { id: req.body.groupId } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!group) {
        return res.status(404).json({ msg: "Group not found" })
    }
    if (req.body?.name.length >= 3) {
        group.name = req.body?.name
    }

    if (req.body?.desc.length >= 10) {
        group.name = req.body?.name
    }
    try {
        if (req.body?.image) {
            req.body.image = new URL(req.body.image)
            group.image = req.body.image.href
        }
    }
    catch (err) {
    }
    await group.save().then(result => {
        res.status(201).json({ msg: 'updated' })
    }).catch(err => next(err))
}

exports.getGroup = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const group = await Group.findOne({ where: { id: req.params.group } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (!group) {
        return res.status(404).json({ msg: "Group not found." })
    }
    return res.status(200).json({
        msg: "Group Found.", data: {
            name: group.name, image: group.image, desc: group.desc,
            createdAt: group.createdAt, creator: group.creator
        }
    })
}

exports.getGroupPosts = async (req, res, next) => {
    const errors = validationResult(req);
    let e = false
    if (!errors.isEmpty()) {
        const err = new Error('Validation Error')
        err.statusCode = 400
        err.errors = errors.array()
        return next(err)
    }
    const posts = await Post.findAll({ where: { groupId: req.params.group } }).catch(err => {
        e = true;
        next(err)
    })
    if (e) {
        return
    }
    if (posts.length <= 0) {
        return res.status(404).json({ msg: "posts not found." })
    }
    else {
        return res.status(200).json({ msg: "Posts Found.", data: posts })
    }
}