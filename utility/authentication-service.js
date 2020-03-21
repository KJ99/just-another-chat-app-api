const fs = require('fs')
const jwt = require('jsonwebtoken')
const path = require('path')
const errors = require('../errors').authentication
const crypto = require('crypto')
const md5 = require('md5')
const DeviceDetector = require('node-device-detector')
const User = require('../schema/user')
const bcrypt = require('bcryptjs')
const Moment = require('moment')

const detector = new DeviceDetector
const TOKEN_FORMAT = 'Bearer'

const KEYS_PATH = path.join(__dirname, '..', '.keys')


const generateDeviceHash = deviceInfo => {
    return typeof deviceInfo == 'object' 
        ? crypto.createHmac('sha256', process.env.API_SECRET).update(JSON.stringify(deviceInfo)).digest('hex')
        : null
}

const generateToken = (user) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(KEYS_PATH, 'private.pem'), (err, key) => {
            if(err) {
                reject(errors.UNKNOWN)
                return
            } 
            const tokenExpiration = Math.floor(Date.now() / 1000) + 15 * 60
            const tokenExpirationDate = new Moment(tokenExpiration * 1000).format('YYYY-MM-DD HH:mm:ss')
            jwt.sign(
                { user: user._id, exp: tokenExpiration }, 
                key, 
                { algorithm: 'RS256' }, 
                (err, data) => {
                if(err) {
                    reject(errors.UNKNOWN)
                } else {
                    resolve({
                        tokenType: TOKEN_FORMAT,
                        token: data,
                        expires: tokenExpiration * 1000,
                        expirationDate: tokenExpirationDate,
                        refresh: user.refreshToken
                    })
                }
            })
        })
        
    })
}

const createResponse = (user, tokenData) => {
    let token = Object.assign({}, tokenData)
    let loggedIn = true
    if(user.banned || !user.verified) {
        loggedIn = false
        token.tokenType = null
        token.token = null
        token.expires = null,
        token.expirationDate = null
        token.refresh = null
    }
    return {
        logged: loggedIn,
        accountBanned: user.banned,
        accountVerified: user.verified,
        _uvs: !user.verified ? user.verificationSecret : null,
        email: user.email,
        ban: {
            reason: user.banReason,
            expires: user.banExpiration,
            pernament: !user.active && user.banExpiration == null
        },
        token: token
    }
}

const unpackToken = request => {
    const authString = request.headers['authorization']
    console.log(authString)
    return typeof authString == 'string' && authString.split(' ').length == 2 && authString.split(' ')[0] === TOKEN_FORMAT 
        ? authString.split(' ')[1]
        : null
}

const authorizeDevice = (user, device) => {
    return new Promise((resolve, reject) => {
        let devices = user.devices
        if(devices.indexOf(device) >= 0) {
            resolve()
            return
        }
        devices.push(device)
        User.update({_id: user._id}, {devices: devices})
        .then(() => {
            resolve()
        })
        .catch(e => reject(errors.UNKNOWN))
    })
}

const login = (request) => {
    return new Promise((resolve, reject) => {
        const username = request.body.username
        const password = request.body.password
        const device = generateDeviceHash(detector.detect(request.headers['user-agent']))
        let user
        User.findOne({
            $or: [
               {username: username},
               {email: username} 
            ]
        })
        .then(userData => {
            if(userData == null) {
                throw errors.BAD_CREDENTIALS
            }
            user = userData
            return bcrypt.compare(password, user.password)
        })
        .then(result => {
            if(!result) {
                throw errors.BAD_CREDENTIALS
            } 
            
            return authorizeDevice(user, device)
        })
        .then(() => {
            return generateToken(user)
        })
        .then(token => {
            resolve(createResponse(user, token))
        })
        .catch(e => {
            if(typeof e == 'object' && typeof e.code == 'number' && typeof e.internalCode == 'number') {
                reject(e)
            } else {
                reject(errors.UNKNOWN)
            }
        })
    })
}

const authenticate = (request) => {
    return new Promise((resolve, reject) => {
        const token = unpackToken(request)
        if(token == null) {
            throw errors.TOKEN_NOT_FOUND
        }
        const decoded = jwt.decode(token)
        if(typeof decoded != 'object') {
            throw errors.INVALID_TOKEN_FORMAT
        } else if((Math.floor(Date.now() / 1000) - decoded.exp) >= 0) {
            throw errors.TOKEN_EXPIRED
        }
        const device = generateDeviceHash(detector.detect(request.headers['user-agent']))
        if(device == null) {
            throw errors.UNKNOWN
        }
        User.findById(decoded.user)
        .then(user => {
            if(user == null) {
                throw errors.USER_NOT_FOUND
            } else if(user.devices.indexOf(device) < 0) {
                throw errors.DEVICE_UNAUTHORIZED
            } else {
                resolve()
            }
        })
        .catch(e => {
            if(typeof e == 'object' && typeof e.code == 'number' && typeof e.internalCode == 'number') {
                reject(e)
            } else {
                reject(errors.UNKNOWN)
            }
        })
    })
}

const getUser = request => {
    return new Promise((resolve, reject) => {
        const token = unpackToken(request)
        if(token == null) {
            throw errors.TOKEN_NOT_FOUND
        }
        const decoded = jwt.decode(token)
        User.findById(decoded.user)
        .then(user => {
            if(user == null) {
                throw errors.USER_NOT_FOUND
            } else {
                resolve(user)
            }
        })
        .catch(e => {
            if(typeof e == 'object' && typeof e.code == 'number' && typeof e.internalCode == 'number') {
                reject(e)
            } else {
                reject(errors.UNKNOWN)
            }
        })
    })
}

const refreshToken = (request) => {
    return new Promise((resolve, reject) => {
        const token = unpackToken(request)
        if(token == null) {
            throw errors.TOKEN_NOT_FOUND
        }
        const refresh = request.body.refresh
        if(typeof refresh != 'string') {
            throw errors.USER_NOT_FOUND
        }
        const decoded = jwt.decode(token)
        const device = generateDeviceHash(detector.detect(request.headers['user-agent']))
        if(device == null) {
            throw errors.UNKNOWN
        }
        User.findById(decoded.user)
        .then(user => {
            if(user == null || user.refreshToken !== refresh) {
                throw errors.USER_NOT_FOUND
            } else if(user.devices.indexOf(device) < 0) {
                throw errors.DEVICE_UNAUTHORIZED
            } 
            return generateToken(user)
        })
        .then(token => {
            resolve(token)
        })
        .catch(e => {
            if(typeof e == 'object' && typeof e.code == 'number' && typeof e.internalCode == 'number') {
                reject(e)
            } else {
                reject(errors.UNKNOWN)
            }
        })
    })
}





module.exports = {
    login: login,
    authenticate: authenticate,
    refreshToken: refreshToken,
    getUser: getUser,
}
