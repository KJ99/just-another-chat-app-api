const Chat = require('../schema/chat')
const crypto = require('crypto')
const md5 = require('md5')
const randomString = require('randomstring')

const generateHash = (secret, postfixLength = 32) => {
    const secretRaw = Date.now().toString() + secret + randomString.generate(postfixLength)
    const hash = crypto.createHmac('sha256', process.env.API_SECRET).update(secretRaw).digest('hex')
    return md5(hash)
}

const generateChatSecret = chat => {
    return generateHash(chat._id, 64)
}

const generateMessageSecret = chat => {
    return generateHash(chat._id)
}

const createStandardChat = (user1, user2) => {
    let chat = new Chat({
        users: [
            {user: user1},
            {user: user2}
        ],
        admins: [],
        canAddUsers: false
    })
    chat.chatSecret = generateChatSecret(chat)
    chat.messageSecret = generateMessageSecret(chat)
    return chat.save()

}

module.exports = {
    createStandardChat: createStandardChat
}