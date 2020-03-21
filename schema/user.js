const mongoose = require('mongoose')
const emailValidator = require('email-validator')

const User = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'email:is_required'],
        unique: [true, 'email:must_be_unique'],
        validate: {
            validator: (v) => {
              return emailValidator.validate(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    password: {
        type: String,
        required: [true, 'password:is_required'],
        validate: {
            validator: (v) => {
              return v.length >= 6
            },
            message: props => `password:too_short`
        }
    },
    fullName: {
        type: String
    },
    username: {
        type: String,
        required: [true, 'username:is_required'],
        unique: [true, 'username:must_be_unique'],
        validate: {
            validator: (v) => {
              return v.length >= 3
            },
            message: props => `username:too_short`
        }
    },
    picture: { 
        data: Buffer, 
        mime: String 
    }, 

    active: {
        type: Boolean,
        required: true,
        default: false
    },

    verified: {
        type: Boolean,
        required: true,
        default: false
    },

    verification: {
        type: {
            pin: {
                type: String, 
                required: false, 
                default: null,
                validate: {
                    validator: (v) => {
                      return v == null || (new RegExp('^[0-9]{6}$')).test(v)
                    },
                    message: props => `pin:invalid`
                }
            },
            expires: {type: Number, required: false, default: null},
            tries: {type: Number, required: true, default: 0}
        },
        required: false,
        default: {pin: null, expires: null}
    },

    verificationSecret: {
        type: String,
        required: false,
        sparse: true,
        default: null
    },

    passwordReset: {
        type: {
            pin: {
                type: String, 
                required: false, 
                default: null,
                validate: {
                    validator: (v) => {
                      return v == null || (new RegExp('^[0-9]{6}$')).test(v)
                    },
                    message: props => `pin:invalid`
                }
            },
            expires: {type: Number, required: false, default: null},
            tries: {type: Number, required: true, default: 0}
        },
        required: false,
        default: {pin: null, expires: null}
    },

    passwordResetSecret: {
        type: String,
        required: false,
        sparse: true,
        default: null
    },

    joinDate: {
        type: Date,
        default: new Date()
    },

    refreshToken: {
        type: String,
        required: true,
        unique: true
    },

    devices: {type: Array},

    connectionToken: {
        type: String,
        sparse: true,
        default: null
    },

    friends: {
        type: [mongoose.Types.ObjectId],
        required: true,
        default: []
    },

    blockedUsers: {
        type: [mongoose.Types.ObjectId],
        required: true,
        default: []
    },

    accountHidden: {
        type: Boolean,
        required: true,
        default: false
    },

    accountPublic: {
        type: Boolean,
        required: true,
        default: false
    },

    darkMode: {
        type: Boolean,
        required: true,
        default: false
    },

    autoAccept: {
        type: Boolean,
        required: true,
        default: false
    },

    autoDownloadImages: {
        type: Boolean,
        required: true,
        default: false
    },

    autoDownloadFiles: {
        type: Boolean,
        required: true,
        default: false
    },

    lastSeen: {
        type: Number,
        required: false,
        default: null
    },
    
    online: {
        type: Boolean,
        required: true,
        default: false
    },

    banned: {
        type: Boolean,
        required: true,
        default: false
    },

    banReason: {
        type: String,
        required: false,
        default: null
    },

    banExpiration: {
        type: Number,
        required: false,
        default: null
    }
})

module.exports = mongoose.model('User', User)