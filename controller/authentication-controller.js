const app = require('express')()
const bodyParser = require('body-parser')
const AuthService = require('../utility/authentication-service')
const UserService = require('../utility/user-service')
const defaultError = require('../errors').unknown
const ErrorResolver = require('../utility/error-resolver')

app.use(bodyParser.json());

app.post('/login', (req, res) => {
    let status = 500
    let body = {}
    const contentType = 'application/json'
    AuthService.login(req)
    .then(token => {
        status = 200
        body = token
    })
    .catch(e => {
        const responseData = ErrorResolver.resolveError(e)
        status = responseData.status
        body = responseData.body
    })
    .finally(() => {
        res.contentType(contentType)
        res.status(status)
        res.end(JSON.stringify(body))
    })
})

app.post('/refresh', (req, res) => {
    let status = 500
    let body = {}
    const contentType = 'application/json'
    AuthService.refreshToken(req)
    .then(token => {
        status = 200
        body = token
    })
    .catch(e => {
        const responseData = ErrorResolver.resolveError(e)
        status = responseData.status
        body = responseData.body
    })
    .finally(() => {
        res.contentType(contentType)
        res.status(status)
        res.end(JSON.stringify(body))
    })
})

app.post('/password/reset/init', (req, res) => {
    let status = 500
    let body = {}
    const contentType = 'application/json'
    
    UserService.initPasswordReset(req.body)
    .then(data => {
        status = 200
        body = data
    })
    .catch(e => {
        const responseData = ErrorResolver.resolveError(e)
        status = responseData.status
        body = responseData.body
    })
    .finally(() => {
        res.contentType(contentType)
        res.status(status)
        res.end(JSON.stringify(body))
    })
})

app.post('/password/reset', (req, res) => {
    let status = 500
    let body = {}
    const contentType = 'application/json'
    
    UserService.resetPassword(req.body)
    .then(() => {
        status = 200
        body = {status: 'success'}
    })
    .catch(e => {
        const responseData = ErrorResolver.resolveError(e)
        status = responseData.status
        body = responseData.body
    })
    .finally(() => {
        res.contentType(contentType)
        res.status(status)
        res.end(JSON.stringify(body))
    })
})

module.exports = app