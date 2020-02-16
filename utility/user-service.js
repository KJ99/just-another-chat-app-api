const crypto = require('crypto')
const md5 = require('md5')
const User = require('../schema/user')
const ChatService = require('./chat-service')
const Cipher = require('./cipher-service')
const errors = require('../errors').user
const randomString = require('randomstring')
const mongoose = require('mongoose')

const TOKEN_VALID_TIME = 10 * 60 * 1000

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
            if(user == null) {
                throw errors.USER_NOT_FOUND
            }
            invitedUser = user
            return User.update({_id: invitedUser._id}, {$push: {friends: loggedUser._id}})
        })
        .then(() => {
            return User.update({_id: loggedUser._id}, {$push: {friends: invitedUser._id}})
        })
        .then(() => {
            return ChatService.createStandardChat(loggedUser, invitedUser)
        })
        .then(chat => {
            console.log(chat)
            session.commitTransaction()
            resolve(chat)
        })
        .catch(e => {
            if(session != null) {
                session.abortTransaction()
            }
            console.log(e)
            reject(e)
        })
    })
}


module.exports = {
    generateConnectionLink: generateConnectionLink,
    removeConnectionLink: removeConnectionLink,
    connect: connect
}