const mongoose = require('mongoose')

const Chat = mongoose.Schema({
    users: {
        type: [{
            user: {type: mongoose.Types.ObjectId, ref: 'User', required: true},
            nickname: String
        }],
        required: true
    },
    admins: {
        type: [{type: mongoose.Types.ObjectId, ref: 'User'}],
        required: true,
        default: []
    },
    canAddUsers: {
        type: Boolean,
        required: true,
        default: false
    },
    userAddingApproval: {
        type: Boolean,
        required: true,
        default: false
    },
    
    chatSecret: {
        type: String,
        required: true,
        unique: true
    },

    messageSecret: {
        type: String,
        required: true,
        unique: true
    }
})

module.exports = mongoose.model('Chat', Chat)