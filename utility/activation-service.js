const User = require('../schema/user')
const errors = require('../errors').verification

const activate = (id, token) => {
    return new Promise((resolve, reject) => {
        if(typeof id != 'string' || typeof token !== 'string') {
            throw errors.UNKNOWN
        }
        User.findOne({
            $and: [
                { _id: id },
                { activationToken: token }
            ]
        })
        .then(user => {
            if(!user) {
                throw errors.USER_NOT_FOUND
            }
            if(user.verified) {
                throw errors.ALREADY_VERIFIED
            }
            return User.update(
                {
                    $and: [
                        {_id: id},
                        { activationToken: token }
                    ]
                },
                {
                    verified: true,
                    active: true,
                    activationToken: null
                }
            )
        })
        .then(() => resolve())
        .catch(e => {
            if(typeof e.code == 'number' && typeof e.internalCode == 'number') {
                reject(e)
            } else {
                reject(errors.UNKNOWN)
            }
        })
    })
}

module.exports = {
    activate: activate
}