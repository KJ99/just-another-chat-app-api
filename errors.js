const unknownError = {code: 500, internalCode: 999, message: 'Internal Server Error'}

module.exports = {
    unknown: unknownError,
    verification: {
        ALREADY_VERIFIED: {code: 409, internalCode: 10001, message: 'account already verified'},
        USER_NOT_FOUND: {code: 404, internalCode: 10002, message: 'user not found'},
        UNKNOWN: unknownError
    },
    registration: {
        INCOMPLETE_FORM: {code: 422, internalCode: 10010, message: 'incomplete form'},
        INVALID_EMAIL: {code: 422, internalCode: 10011, message: 'provided email address is not valid'},
        EMAIL_TEAKEN: {code: 422, internalCode: 10012, message: 'user with that email address already exists'},
        PASSWORD_TOO_SHORT: {code: 422, internalCode: 10013, message: 'provided password is too short'},
        PASSWORDS_NOT_THE_SAME: {code: 422, internalCode: 10014, message: 'passwords are not the same'},
        USERNAME_TOO_SHORT: {code: 422, internalCode: 10015, message: 'provided username is too short'},
        USERNAME_TEAKEN: {code: 422, internalCode: 10016, message: 'user with that username already exists'},
        UNKNOWN: unknownError
    },
    authentication: {
        INVALID_TOKEN_FORMAT: {code: 401, internalCode: 10020, message: 'token invalid'},
        TOKEN_NOT_FOUND: {code: 401, internalCode: 10021, message: 'token not found'},
        TOKEN_EXPIRED: {code: 403, internalCode: 10022, message: 'token expired'},
        DEVICE_UNAUTHORIZED: {code: 403, internalCode: 10023, message: 'device not authorized'},
        USER_NOT_FOUND: {code: 403, internalCode: 10024, message: 'user not found'},
        BAD_CREDENTIALS: {code: 403, internalCode: 10025, message: 'invalid username or password'},
        CREDENTIALS_NOT_FOUND: {code: 401, internalCode: 10025, message: 'credentials not found'},
        ACCOUNT_INACTIVE: {code: 403, internalCode: 10026, message: 'account is not active'},
        ACCOUNT_NOT_VERIFIED: {code: 403, internalCode: 10027, message: 'account is not verified'},
        UNKNOWN: unknownError
    },
    user: {
        USER_NOT_FOUND: {code: 403, internalCode: 10030, message: 'user not found'},
        UNKNOWN: unknownError
    }
}