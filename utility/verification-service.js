const User = require('../schema/user')
const errors = require('../errors').verification

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

            const { pin, expires } = user.verification

            if (typeof pin != 'string' || typeof expires != 'number' || expires <= Date.now()) {
                throw errors.PIN_EXPIRED
            } else if(pin !== data.pin) {
                throw errors.USER_NOT_FOUND
            }

            return User.update(
                {_id: user._id},
                {
                    verified: true,
                    active: true,
                    verificationSecret: null,
                    verification: { pin: null, expires: null }
                }
            )
        })
        .then(() => resolve())
        .catch(e => reject(e))
    })
}

module.exports = {
    activate: activate
}