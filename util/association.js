const User = require('../model/user')
const Post = require('../model/post')
const Group = require('../model/group')
const comment = require('../model/util/comment')
const friendReq = require('../model/util/friendReq')
const block = require('../model/util/block')
const friend = require('../model/util/friend')
const like = require('../model/util/like')
// const share = require('../model/util/share')
const admin = require('../model/util/admin')
const joingroup = require('../model/util/joingroup')
const joingroupreq = require('../model/util/joingroupreq')
const groupBlock = require('../model/util/groupBlock')
const reply = require('../model/util/reply')

module.exports = () => {
    comment.belongsToMany(comment, { as: 'replyFrom', through: reply, foreignKey: 'reply' })
    comment.belongsToMany(comment, { as: 'replyTo', through: reply, foreignKey: 'replyTo' })

    User.belongsToMany(User, { as: 'friend1', through: friend, foreignKey: 'friend' })
    User.belongsToMany(User, { as: 'friend2', through: friend, foreignKey: 'friendTo' })

    User.belongsToMany(User, { as: 'blockFrom', through: block, foreignKey: 'block' })
    User.belongsToMany(User, { as: 'blockTo', through: block, foreignKey: 'blockTo' })


    User.belongsToMany(User, { as: 'from', through: friendReq, foreignKey: 'from' })
    User.belongsToMany(User, { as: 'to', through: friendReq, foreignKey: 'to' })

    /* User.belongsToMany(Post, { through: comment })
    i didn't 
    do that because it didn't allow me to have multiple comments with the same email and the same post
    so i did the foreign keys in the comment model itself
    */

    User.belongsToMany(Post, { through: like })

    /*User.belongsToMany(Post, { through: share }) i didn't 
    do that because it didn't allow me to have multiple shares with the same email and the same post
    so i did the foreign keys in the share model itself
    */
    User.hasMany(Post)

    User.hasMany(Group, { foreignKey: 'creator' })

    User.belongsToMany(Group, { through: joingroupreq })

    User.belongsToMany(Group, { through: groupBlock })

    User.belongsToMany(Group, { through: admin })

    User.belongsToMany(Group, { through: joingroup })

    Group.hasMany(Post)

}