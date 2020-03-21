const User = require('../schema/user')
const UserService = require('./user-service')
const errors = require('../errors').verification
const mongoose = require('mongoose')
const Mailer = require('./mailer-service')

const activate = (data) => {
    return new Promise((resolve, reject) => {
        if(typeof data != 'object' || typeof data.pin != 'string' || typeof data.secret !== 'string') {
            throw errors.UNKNOWN
        }
        User.findOne({ 
            $and: [
                { verificationSecret: { $ne: null } },
                { verificationSecret: data.secret }
            ]
         })
        .then(user => {
            if(!user) {
                throw errors.USER_NOT_FOUND
            } else if(user.verified) {
                throw errors.ALREADY_VERIFIED
            }

            const { pin, expires, tries } = user.verification

            if (typeof pin != 'string' || typeof expires != 'number' || expires <= Date.now() || tries <= 0) {
                throw errors.PIN_EXPIRED
            } 
            else if(pin !== data.pin) {
                decrementPinTries(user._id)
                throw errors.PIN_INVALID
            }
            
            
            return User.update(
                {_id: user._id},
                {
                    verified: true,
                    active: true,
                    verification: { pin: null, expires: null, tries: 0 }
                }
            )
        })
        .then(() => resolve())
        .catch(e => reject(e))
    })
}

const decrementPinTries = async (id, callback) => {
    let result
    try {
        const res = await User.updateOne({_id: id}, {$inc: {'verification.tries': -1}})
        result = res.ok
    } catch(e) {
        result = false
    }
    if(typeof callback == 'function') {
        callback(result)
    }
}

const resendEmail = (data) => {
    return new Promise((resolve, reject) => {
        if(typeof data != 'object' || typeof data.username != 'string') {
            throw errors.USER_NOT_FOUND
        }
        let user = null
        let session = null
        mongoose.startSession()
        .then(_session => {
            session = _session
            session.startTransaction()
            return  User.findOne({ 
                $or: [
                   {username: data.username},
                   {email: data.username} 
                ]
             }).session(session)
        })
        .then(_user => {
            user = _user
            if(user == null) {
                throw errors.USER_NOT_FOUND
            }
            if(user.verified || user.active) {
                throw errors.ALREADY_VERIFIED
            }
            const verification = UserService.generateAccountVerification(user)
            return User.updateOne({_id: user._id}, {
                verificationSecret: verification.secret,
                verification: verification.pinData
            }).session(session)   
        })
        .then(() => {
            return User.findById(user._id).session(session)
        })
        .then(_user => {
            user = _user
            return Mailer.sendVerificationEmail(user)
        })
        .then(() => {
            session.commitTransaction()
            resolve({_uvs: user.verificationSecret})
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
    activate: activate,
    resendEmail: resendEmail
}