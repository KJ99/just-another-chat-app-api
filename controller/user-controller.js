const app = require('express')()
const AuthService = require('../utility/authentication-service')
const UserService = require('../utility/user-service')
const ErrorResolver = require('../utility/error-resolver')
const bodyParser = require('body-parser')
// const multer = require('multer')
// const path = require('path')
// const upload = multer({dest: path.join(__dirname, '..', 'assets', 'uploads')})

app.use(bodyParser.json())

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

app.get('/settings', (req, res) => {
    let status = 500
    let body = {}
    const contentType = 'application/json'
    AuthService.getUser(req)
    .then(user => {
        status = 200
        body = {
            darkMode: user.darkMode,
            hiddenAccount: user.accountHidden,
            publicAccount: user.accountPublic,
            acceptAutomatically: user.autoAccept,
            downloadImagesAutomatically: user.autoDownloadImages,
            downloadFilesAutomatically: user.autoDownloadFiles
        }
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

app.post('/settings/update', (req, res) => {
    let status = 500
    let body = {}
    const contentType = 'application/json'
    AuthService.getUser(req)
    .then(user => {
        return UserService.updateUserSettings(user, req.body)
    })
    .then(() => {
        status = 200
        body = { message: 'success' }
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

// app.post('/update', upload.single('image'), (req, res) => {
//     console.log(req.file)
//     console.log(req.files)
//     console.log(req.body)
//     res.send(200)
// })

module.exports = app