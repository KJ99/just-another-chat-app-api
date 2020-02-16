const app = require('express')()
const defaultError = require('../errors').unknown
const ActivationService = require('../utility/activation-service')
const ErrorResolver = require('../utility/error-resolver')

app.set('view engine', 'ejs');

app.get('/:user/:token', (req, res) => {

    let success = false
    let error = null

    ActivationService.activate(req.params.user, req.params.token)
    .then(() => {
        success = true
    })
    .catch(e => {
        success = false
        error = e
    })
    .finally(() => {
        res.render('account-activated', {success: success, error: error})
    })    
})

module.exports = app