const crypto = require('crypto')
const md5 = require('md5')
const User = require('../schema/user')
const ChatService = require('./chat-service')
const Cipher = require('./cipher-service')
const errors = require('../errors').user
const randomString = require('randomstring')
const mongoose = require('mongoose')
const Mailer = require('./mailer-service')
const bcrypt = require('bcryptjs')

const TOKEN_VALID_TIME = 15 * 60 * 1000
const VERIFICATION_EXPIRE_TIME = 1 * 60 * 60 * 1000
const VERIFICATION_PIN_TRIES = 5
const MIN_PASSWORD_LENGTH = 6

const generateToken = (secret, postfixLength = 16) => {
    const tokenString = Date.now().toString() + secret + randomString.generate(postfixLength)
    return crypto.createHmac('sha256', process.env.API_SECRET).update(tokenString).digest('hex')
}

const generateActivationPin = () => {
    return randomString.generate({length: 6, charset: 'numeric'})
}

const generateActivationSecret = user => {
    return generateToken(user._id, 32)
}

const generatePasswordResetSecret = user => {
    return generateToken(user._id, 64)
}

const generatePasswordResetPin = () => {
    return randomString.generate({length: 6, charset: 'numeric'})
}

const prepareCurrentUserData = (user) => {
    const pictureData = user.picture != null 
        ? `data:${user.picture.mime};base64, ${user.picture.data.toString('base64')}`
        : null
    return {
        user: {
            displayName: user.fullName || user.username,
            picture: pictureData,
            username: user.username,
            fullName: user.fullName,
            email: user.email
        },
        settings: {
            darkMode: user.darkMode,
            hiddenAccount: user.accountHidden,
            publicAccount: user.accountPublic,
            acceptAutomatically: user.autoAccept,
            downloadImagesAutomatically: user.autoDownloadImages,
            downloadFilesAutomatically: user.autoDownloadFiles
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

const generateAccountVerification = user => {
    return {
        secret: generateActivationSecret(user),
        pinData: {
            pin: generateActivationPin(),
            expires: Date.now() + VERIFICATION_EXPIRE_TIME,
            tries: VERIFICATION_PIN_TRIES
        }
    }
}

const generatePasswordReset = user => {
    return {
        secret: generatePasswordResetSecret(user),
        pinData: {
            pin: generatePasswordResetPin(),
            expires: Date.now() + VERIFICATION_EXPIRE_TIME,
            tries: VERIFICATION_PIN_TRIES
        }
    }
}

const initPasswordReset = data => {
    return new Promise((resolve, reject) => {
        if(typeof data != 'object' || typeof data.email != 'string') {
            throw errors.USER_NOT_FOUND
        }
        let user = null
        User.findOne({email: data.email})
        .then(_user => {
            user = _user
            if(user == null || !user.active) {
                throw errors.USER_NOT_FOUND
            } 
            if(!user.verified) {
                throw errors.ACCOUNT_NOT_VERIFIED
            }
            const reset = generatePasswordReset(user)
            return User.updateOne({_id: user._id}, {
                passwordResetSecret: reset.secret,
                passwordReset: reset.pinData
            })
        })
        .then(() => { return User.findById(user._id) })
        .then(_user => {
            user = _user
            return Mailer.sendPasswordResetEmail(user)
        })
        .then(() => {
            resolve({_prs: user.passwordResetSecret})
        })
        .catch(e => reject(e))
    })
}

const resetPassword = data => {
    return new Promise((resolve, reject) => {
        if(typeof data != 'object' || typeof data.secret != 'string' || typeof data.pin !== 'string') {
            throw errors.USER_NOT_FOUND
        }
        if(typeof data.password != 'string' || typeof data.confirmPassword != 'string') {
            throw errors.PASSWORD_NOT_FOUND
        }
        if(data.password.length < MIN_PASSWORD_LENGTH) {
            throw errors.PASSWORD_TOO_SHORT
        }
        if(data.password !== data.confirmPassword) {
            throw errors.PASSWORDS_NOT_THE_SAME
        }
        let newPassword = null
        bcrypt.hash(data.password, 5)
        .then(hash => {
            newPassword = hash
            return User.findOne({
                $and: [
                    {passwordResetSecret: {$ne: null}},
                    {passwordResetSecret: data.secret},
                    {verified: true},
                    {active: true}
                ]
            })
        })
        .then(user => {
            if(user == null) {
                throw errors.USER_NOT_FOUND
            }
            const { pin, expires, tries } = user.passwordReset
            if(typeof pin != 'string' || typeof expires != 'number' || typeof tries != 'number') {
                throw errors.USER_NOT_FOUND
            }
            if(expires <= Date.now() || tries <= 0) {
                throw errors.PIN_EXPIRED
            }
            if(pin !== data.pin) {
                decrementPinTries(user._id)
                throw errors.INVALID_PIN
            }
            return User.updateOne({_id: user._id}, {
                password: newPassword,
                passwordResetSecret: null,
                passwordReset: {
                    pin: null,
                    expires: null,
                    tries: 0
                }
            })
        })
        .then(() => resolve())
        .catch(e => reject(e))
    })
}

const decrementPinTries = async (id, callback) => {
    let result
    try {
        const res = await User.updateOne({_id: id}, {$inc: {'passwordReset.tries': -1}})
        result = res.ok
    } catch(e) {
        result = false
    }
    if(typeof callback == 'function') {
        callback(result)
    }
}

const updateUserSettings = async (user, data) => {
    if(typeof data != 'object') {
        throw errors.INVALID_FORM_DATA // change to invalid entity
    } else if(typeof user._id == 'undefined') {
        throw errors.USER_NOT_FOUND
    }
    let updateData = {}
    if(typeof data.darkMode == 'boolean') {
        updateData.darkMode = data.darkMode
    }
    if(typeof data.hiddenAccount == 'boolean') {
        updateData.accountHidden = data.hiddenAccount
    }
    if(typeof data.publicAccount == 'boolean') {
        updateData.accountPublic = data.publicAccount
    }
    if(typeof data.acceptAutomatically == 'boolean') {
        updateData.autoAccept = data.acceptAutomatically
    }
    if(typeof data.downloadImagesAutomatically == 'boolean') {
        updateData.autoDownloadImages = data.downloadImagesAutomatically
    }
    if(typeof data.downloadFilesAutomatically == 'boolean') {
        updateData.autoDownloadFiles = data.downloadFilesAutomatically
    }
    
    await User.updateOne({_id: user._id}, updateData)
}

module.exports = {
    generateConnectionLink: generateConnectionLink,
    removeConnectionLink: removeConnectionLink,
    connect: connect,
    prepareCurrentUserData: prepareCurrentUserData,
    getBasicUserData: getBasicUserData,
    generateAccountVerification: generateAccountVerification,
    initPasswordReset: initPasswordReset,
    resetPassword: resetPassword,
    updateUserSettings: updateUserSettings,
}