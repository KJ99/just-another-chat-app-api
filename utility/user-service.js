const crypto = require('crypto')
const md5 = require('md5')
const User = require('../schema/user')
const ChatService = require('./chat-service')
const Cipher = require('./cipher-service')
const errors = require('../errors').user
const randomString = require('randomstring')
const mongoose = require('mongoose')

const TOKEN_VALID_TIME = 10 * 60 * 1000

const prepareCurrentUserData = (user) => {
    const pictureData = user.picture != null 
        ? `data:${user.picture.mime};base64, ${user.picture.data.toString('base64')}`
        : null
    return {
        name: user.fullName || user.username,
        picture: pictureData,
        settings: {
            hiddenAccount: user.accountHidden
        } 
    }
}

const prepareBasicUserData = user => {
    const pictureData = user.picture != null 
        ? `data:${user.picture.mime};base64, ${user.picture.data.toString('base64')}`
        : null
    return {
        name: user.fullName || user.username,
        picture: pictureData,
        lastSeen: user.lastSeen
    }
}


const getBasicUserData = (loggedUser, id) => {
    return new Promise((resolve, reject) => {
        User.findById(id)
        .then(user => {
            if(user == null 
                || user.friends.indexOf(loggedUser._id) < 0 
                || user.blockedUsers.indexOf(loggedUser._id) >= 0
                || !user.active) {
                throw errors.USER_NOT_FOUND
            }
            resolve(prepareBasicUserData(user))
        })
        .catch(e => {
            reject(e)
        })
    })
}

const fetchListOfConnections = async (user, callback = null) => {
    let data = {friends: [], blocked: []}
    for(let i = 0; i < user.friends.length; i++) {
        let friend = await User.findById(user.friends[i])
        if(friend != null && friend.active) {
            data.friends.push(prepareBasicUserData(friend))
        }
    } 
    for(let i = 0; i < user.blockedUsers.length; i++) {
        let blocked = await User.findById(user.blockedUsers[i])
        if(blocked != null && blocked.active) {
            data.blocked.push(prepareBasicUserData(blocked))
        }
    }
    if(typeof callback == 'function') {
        callback(data)
    }
}

const prepareConnectionsData = user => {
    return new Promise((resolve, reject) => {
        fetchListOfConnections(user, data => resolve(data))
    })
}


const generateConnectionLink = (user, https = false) => {
    return new Promise((resolve, reject) => {
        const tokenRaw = Date.now().toString() + user._id + randomString.generate(32)
        const tokenHash = crypto.createHmac('sha256', process.env.API_SECRET)
            .update(tokenRaw)
            .digest('hex')
        const tokenData = {
            token: md5(tokenHash),
            expires: Date.now() + TOKEN_VALID_TIME
        }
        let token = null
        Cipher.encrypt(JSON.stringify(tokenData))
        .then(tokenString => {
            token = tokenString
            return User.update({_id: user._id}, {connectionToken: token})
        })
        .then(() => {
            const protocol = https ? 'https' : 'http'
            const link = protocol + '://' + process.env.API_HOST + '/user/connect/' + encodeURIComponent(token)
            resolve(link)
        })
        .catch(e => {
            reject(e)
        })
    })
}

const removeConnectionLink = user => {
    return new Promise((resolve, reject) => {
        User.update({_id: user._id}, {connectionToken: null})
        .then(() => {
            resolve()
        })
        .catch(e => {
            reject(errors.UNKNOWN)
        })
    })
}

const connect = (loggedUser, connectionToken) => {
    return new Promise((resolve, reject) => {
        if(connectionToken == null) {
            throw errors.USER_NOT_FOUND
        }
        let invitedUser = null
        let session = null
        Cipher.decrypt(connectionToken)
        .then(data => {
            const token = JSON.parse(data)
            if(typeof token != 'object' || typeof token.expires !== 'number' || token.expires < Date.now()) {
               throw errors.USER_NOT_FOUND 
            }
            return mongoose.startSession()
        })
        .then(_session => {
            session = _session
            session.startTransaction()
            return User.findOne({connectionToken: connectionToken})
        })
        .then(user => {
            if(user == null || user.accountHidden) {
                throw errors.USER_NOT_FOUND
            } else if(user._id === loggedUser._id) {
                throw errors.CONNECTION_WITH_YOURSELF
            } else if(loggedUser.blockedUsers.indexOf(user._id) >= 0 || user.blockedUsers.indexOf(loggedUser._id) >= 0) {
                throw errors.USER_NOT_FOUND
            } else if(loggedUser.friends.indexOf(user._id) >= 0) {
                throw errors.ALREADY_CONNECTED
            }
            
            invitedUser = user
            return User.updateOne(
                {_id: invitedUser._id}, 
                {$push: {friends: loggedUser._id}}
            ).session(session)
        })
        .then(() => {
            return User.updateOne(
                {_id: loggedUser._id}, 
                {$push: {friends: invitedUser._id}}
            ).session(session)
        })
        .then(() => {
            return ChatService.createStandardChat(loggedUser, invitedUser).session(session)
        })
        .then(chat => {
            session.commitTransaction()
            resolve(prepareBasicUserData(invitedUser))
        })
        .catch(e => {
            if(session != null) {
                session.abortTransaction()
            }
            reject(e)
        })
    })
}


module.exports = {
    generateConnectionLink: generateConnectionLink,
    removeConnectionLink: removeConnectionLink,
    connect: connect,
    prepareCurrentUserData: prepareCurrentUserData,
    getBasicUserData: getBasicUserData
}