const app = require('express')()
const bodyParser = require('body-parser')
const AuthService = require('../utility/authentication-service')
const defaultError = require('../errors').unknown

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
        if(typeof e == 'object') {
            status = e.code
            body = {
                code: e.internalCode,
                message: e.message
            }
        } else {
            status = 500
            body = {
                code: defaultError.internalCode,
                message: defaultError.message
            }
        }
    })
    .finally(() => {
        res.contentType(contentType)
        res.status(status)
        res.end(JSON.stringify(body))
    })
})

//temporary
app.get('/testaroo', (req, res) => {
    let status = 500
    let body = {}
    const contentType = 'application/json'
    AuthService.authenticate(req)
    .then(() => {
        status = 200
        body = {result: 'success'}
    })
    .catch(e => {
        if(typeof e == 'object') {
            status = e.code
            body = {
                code: e.internalCode,
                message: e.message
            }
        } else {
            status = 500
            body = {
                code: defaultError.internalCode,
                message: defaultError.message
            }
        }
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
        if(typeof e == 'object') {
            status = e.code
            body = {
                code: e.internalCode,
                message: e.message
            }
        } else {
            status = 500
            body = {
                code: defaultError.internalCode,
                message: defaultError.message
            }
        }
    })
    .finally(() => {
        res.contentType(contentType)
        res.status(status)
        res.end(JSON.stringify(body))
    })
})

module.exports = app