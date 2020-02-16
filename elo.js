const crypto = require('crypto')
const randomString = require('randomstring')
const md5 = require('md5')

const s = randomString.generate(4096)

const data = randomString.generate(8192)

const secret = crypto.createHmac('sha256', s).update(data).digest('hex')
console.log(secret)