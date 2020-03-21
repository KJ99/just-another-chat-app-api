const app = require('express')()
const defaultError = require('../errors').unknown
const ActivationService = require('../utility/verification-service')
const ErrorResolver = require('../utility/error-resolver')
const bodyParser = require('body-parser')

app.use(bodyParser.json())

app.post('/', (req, res) => {
    let status = 500
    let body = {}
    const contentType = 'application/json'

    ActivationService.activate(req.body)
    .then(() => {
        status = 200
        body = { status: 'success' }
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

app.post('/resend', (req, res) => {
    let status = 500
    let body = {}
    const contentType = 'application/json'

    ActivationService.resendEmail(req.body)
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

module.exports = app