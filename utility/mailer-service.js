const nodemailer = require('nodemailer')
const fs = require('fs');
const ejs = require('ejs');
const path = require('path')
const errors = require('../errors').verification

const EMAIL_TEMPLATES = path.join(__dirname, '..', 'views', 'email-templates')

const EMAIL_VERIFICATION_TEMPLATE = path.join(EMAIL_TEMPLATES, 'verification-email.ejs')

const sendVerificationEmail = (user) => {
    return new Promise((resolve, reject) => {
        console.log('sending email...')
        if(user.verified || !user.activationToken) {
            throw errors.ALREADY_VERIFIED
        }   
        
        console.log('template...')
        readTemplate(EMAIL_VERIFICATION_TEMPLATE, {user: user})
        .then(body => {
            console.log('sending')
            return sendHtmlEmail(user.email, 'Verify your email address', body)
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
        readFile(path)
        .then(content => {
            return ejs.render(content.toString(), data)
        })
        .then(result => resolve(result))
        .catch(e => reject(e))
    })
}

const readFile = path => {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if(err) {
                reject(err)
            } else {
                resolve(data)
            }
        }) 
    })
}

module.exports = {
    sendVerificationEmail: sendVerificationEmail
}