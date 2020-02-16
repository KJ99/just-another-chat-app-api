const defaultError = require('../errors').unknown

const resolveError = e => {
    let response = {
        status: defaultError.code,
        body: {
            code: defaultError.internalCode,
            message: defaultError.message
        }
    }
    if(typeof e == 'object' && typeof e.code == 'number' && typeof e.internalCode == 'number') {
        response.status = e.code
        response.body.code = e.internalCode
        response.body.message = e.message || ''
    }
    return response
}

module.exports = {
    resolveError: resolveError
}