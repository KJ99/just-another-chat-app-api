const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const unknownError = require('../errors').unknown
const KEY_DIR = path.join(__dirname, '..', '.keys')

const readKey = filename => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(KEY_DIR, filename), (err, data) => {
            if(err) {
                reject(unknownError)
            } else {
                resolve(data)
            }
        })
    })
}

const encrypt = text => {
    return new Promise((resolve, reject) => {
        readKey('public.pem')
        .then(key => {
            const toEncrypt = Buffer.from(text)
            const encrypted = crypto.publicEncrypt({key: key, padding: crypto.constants.RSA_PKCS1_PADDING}, toEncrypt)
            resolve(encrypted.toString('base64'))
        })
        .catch(e => reject(e))
    })
}

const decrypt = text => {
    return new Promise((resolve, reject) => {
        readKey('private.pem')
        .then(key => {
            const toDecrypt = Buffer.from(text, 'base64')
            const decrypted = crypto.privateDecrypt({key: key, padding: crypto.constants.RSA_PKCS1_PADDING}, toDecrypt)
            resolve(decrypted.toString('utf8'))
        })
        .catch(e => reject(e))
    })
}

module.exports = {
    encrypt: encrypt,
    decrypt: decrypt
}