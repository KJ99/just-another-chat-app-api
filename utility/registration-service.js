const User = require('../schema/user')
const Mailer = require('./mailer-service')
const crypto = require('crypto')
const base64 = require('base-64')
const md5 = require('md5')
const randomString = require('randomstring')
const emailValidator = require('email-validator')
const fs = require('fs')
const path = require('path')
const errors = require('../errors').registration
const bcrypt = require('bcryptjs')
const mime = require('mime')

const VERIFICATION_EXPIRE_TIME = 1 * 60 * 60 * 1000

const findDataError = data => {
    let error = null
    if(!isFormComplete(data)) {
        error = errors.INCOMPLETE_FORM
    }
    else if(!emailValidator.validate(data.email)) {
        error = errors.INVALID_EMAIL
    }
    else if(data.password.length < 6) {
        error = errors.PASSWORD_TOO_SHORT
    }
    else if(data.password !== data.confirmPassword) {
        error = errors.PASSWORDS_NOT_THE_SAME
    }
    else if(data.username.length < 3) {
        error = errors.USERNAME_TOO_SHORT
    }
    return error
}

const isFormComplete = data => {
    return typeof data == 'object' &&
        typeof data.email == 'string' &&
        typeof data.username == 'string' &&
        typeof data.password == 'string' &&
        typeof data.confirmPassword == 'string'
}

const findDuplicationError = msg => {
    const column = findDuplicatedColumn(msg)
    let error = null
    switch(column.toLowerCase()) {
        case 'email':
            error = errors.EMAIL_TEAKEN
            break
        case 'username':
            error = errors.USERNAME_TEAKEN
            break
        default:
            error = errors.UNKNOWN
            break
    }
    return error
}

const findDuplicatedColumn = msg => {
    return msg.substring(msg.indexOf('index: ') + 'index: '.length, msg.search(new RegExp('_[0-9]* dup key: {')))
}

const generateToken = (secret, postfixLength = 16) => {
    const tokenString = Date.now().toString() + secret + randomString.generate(postfixLength)
    return crypto.createHmac('sha256', process.env.API_SECRET).update(tokenString).digest('hex')
}

const generateActivationSecret = user => {
    return generateToken(user._id, 32)
}


const generateRefreshToken = user => {
    return generateToken(user._id, 64)
}

const generateActivationPin = () => {
    return randomString.generate({length: 6, charset: 'numeric'})
}

const fetchDefaultPicture = () => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(__dirname, '..', 'assets', 'images', 'user-default.jpg')
        fs.readFile(filePath, (err, data) => {
            if(err) {
                reject(errors.UNKNOWN)
            } else {
                resolve({
                    mime: mime.getType(filePath),
                    data: data
                })
            }
        })
    })
}

const register = (data) => {
    return new Promise((resolve, reject) => {
        const error = findDataError(data)
        if(error != null) {
            throw error
        } 
        let user = new User({
            email: data.email,
            username: data.username,
            fullName: data.fullName || null,
            active: false,
            verified: false,
            devices: []
        })
        bcrypt.hash(data.password, 5)
        .then(hash => {
            user.password = hash
            return fetchDefaultPicture()
        })
        .then(data => {
            user.picture = data
            user.verificationSecret = generateActivationSecret(user)
            user.verification = {
                pin: generateActivationPin(),
                expires: Date.now() + VERIFICATION_EXPIRE_TIME
            }
            user.refreshToken = generateRefreshToken(user)
            return user.save()
        })
        .then(() => {
            Mailer.sendVerificationEmail(user).catch(e => {})
            resolve(user)
        })
        .catch(e => {
            if(typeof e.code == 'number' && typeof e.internalCode == 'number') {
                reject(e)
            } else if(typeof e == 'object' && e.name === 'MongoError' && e.code === 11000){
                reject(findDuplicationError(e.errmsg))
            } else {
                reject(errors.UNKNOWN)
            }
        })
    })
}

module.exports = {
    register: register
}