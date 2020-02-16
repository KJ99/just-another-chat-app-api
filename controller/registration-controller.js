const app = require('express')()
const bodyParser = require('body-parser')
const RegistrationService = require('../utility/registration-service')
const defaultError = require('../errors').unknown
const ErrorResolver = require('../utility/error-resolver')

app.use(bodyParser.json());

app.post('/', (req, res) => {
    let status = 500
    let body = {}
    const contentType = 'application/json'
    RegistrationService.register(req.body)
    .then(user => {
        status = 201
        body = {result: 'success'}
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