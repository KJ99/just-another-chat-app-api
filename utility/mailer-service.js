const nodemailer = require('nodemailer')
const fs = require('fs');
const ejs = require('ejs');
const path = require('path')
const errors = require('../errors').verification

const EMAIL_TEMPLATES = path.join(__dirname, '..', 'views', 'email-templates')

const EMAIL_VERIFICATION_TEMPLATE = path.join(EMAIL_TEMPLATES, 'verification-email.ejs')
const PASSWORD_RESET_TEMPLATE = path.join(EMAIL_TEMPLATES, 'password-reset-email.ejs')

const sendVerificationEmail = (user) => {
    return new Promise((resolve, reject) => {
        if(user.verified || !user.verificationSecret || !user.verification || !user.verification.pin) {
            throw errors.ALREADY_VERIFIED
        }   
        console.log('render')
        readTemplate(EMAIL_VERIFICATION_TEMPLATE, {user: user})
        .then(body => {
            console.log('send')
            return sendHtmlEmail(user.email, 'Activate your account', body)
        })
        .then(result => {
            
        console.log('sent')
            resolve(result)
        })
        .catch(e => {
            console.log('not sent')
            
        console.log(e)
            reject(e)
        })
        
    })
}

const sendPasswordResetEmail = (user) => {
    return new Promise((resolve, reject) => {
        if(user == null || !user.verified || !user.active || !user.passwordResetSecret) {
            throw errors.USER_NOT_FOUND
        }   
        
        readTemplate(PASSWORD_RESET_TEMPLATE, {user: user})
        .then(body => {
            return sendHtmlEmail(user.email, 'Reset your password', body)
        })
        .then(result => {
            resolve(result)
        })
        .catch(e => {
            reject(e)
        })
        
    })
}

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_TRANSPORT_USER,
            pass: process.env.MAIL_TRANSPORT_PASS
        }
    })
}

const sendHtmlEmail = (receiver, subject, body) => {
    const mailOptions = {
        from: process.env.MAIL_FROM,
        to: receiver,
        subject: subject,
        html: body
    }
    return createTransporter().sendMail(mailOptions)
}

const readTemplate = (path, data) => {
    return new Promise((resolve, reject) => {
        console.log('reading template... ')
        readFile(path)
        .then(content => {
            console.log('rendering email...')
            return ejs.render(content.toString(), data)
        })
        .then(result => resolve(result))
        .catch(e => reject(e))
    })
}

const readFile = path => {
    return new Promise((resolve, reject) => {
        console.log('reading file ', path)
        fs.readFile(path, (err, data) => {
            console.log('fileerr', err)
            console.log(data)
            if(err) {
                reject(err)
            } else {
                resolve(data)
            }
        }) 
    })
}

module.exports = {
    sendVerificationEmail: sendVerificationEmail,
    sendPasswordResetEmail: sendPasswordResetEmail
}