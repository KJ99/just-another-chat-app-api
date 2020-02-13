const app = require('express')()
const bodyParser = require('body-parser')
const RegistrationService = require('../utility/registration-service')
const defaultError = require('../errors').unknown

app.use(bodyParser.json());

app.post('/', (req, res) => {
    let status = 500
    let body = {}
    const contentType = 'application/json'
    RegistrationService.register(req.body)
    .then(user => {
        console.log(user)
        status = 201
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

module.exports = app