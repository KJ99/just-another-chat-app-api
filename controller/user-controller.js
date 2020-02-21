const app = require('express')()
const AuthService = require('../utility/authentication-service')
const UserService = require('../utility/user-service')
const ErrorResolver = require('../utility/error-resolver')

app.use((req, res, next) => {
    AuthService.authenticate(req)
    .then(() => next())
    .catch(e => {
        let responseData = ErrorResolver.resolveError(e)
        res.contentType('application/json')
        res.status(responseData.status)
        res.end(JSON.stringify(responseData.body))
    })
})

app.get('/', (req, res) => {
    let status = 500
    let body = {}
    const contentType = 'application/json'
    AuthService.getUser(req)
    .then(user => {
        status = 200
        body = UserService.prepareCurrentUserData(user)
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

app.get('/:id', (req, res) => {
    let status = 500
    let body = {}
    const contentType = 'application/json'
    AuthService.getUser(req)
    .then(user => {
        return UserService.getBasicUserData(user, req.params.id)
    })
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

app.get('/connection/new', (req, res) => {
    let status = 500
    let body = {}
    const contentType = 'application/json'
    AuthService.getUser(req)
    .then(user => {
        return UserService.generateConnectionLink(user)
    })
    .then(link => {
        status = 200
        body = {link: link}
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

app.get('/connection/cancel', (req, res) => {
    let status = 500
    let body = {}
    const contentType = 'application/json'
    AuthService.getUser(req)
    .then(user => {
        return UserService.removeConnectionLink(user)
    })
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

app.get('/connect/:token', (req, res) => {
    let status = 500
    let body = {}
    const contentType = 'application/json'
    AuthService.getUser(req)
    .then(user => {
        return UserService.connect(user, req.params.token)
    })
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