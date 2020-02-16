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

    activationToken: {
        type: String,
        required: false,
        sparse: [true, 'token:must_be_unique']
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
    }
})

module.exports = mongoose.model('User', User)