require('dotenv').config({path: __dirname + '/.env'})
const app = require('express')()
const http = require('http')
const database = require('./db')
const WebSocket = require('websocket')

const RegistrationController = require('./controller/registration-controller')
const VerificationController = require('./controller/verification-controller')
const AuthController = require('./controller/authentication-controller')

const serverPort = process.env.NODE_PORT || 8080
const webSocketPort = process.env.WEB_SOCKET_PORT || 3000

app.use('/register', RegistrationController)
app.use('/verify', VerificationController)
app.use('/auth', AuthController)

app.get('/dupa', (req, res) => {
    require('./schema/user').find({})
    .then(data => {
        res.status(200);
        res.contentType('json')
        res.end(JSON.stringify(data))
    })
    .catch(e => {
        res.status(500);
        res.contentType('json')
        res.end({})
    })

})

const server = http.createServer(app)
const webSocketServer = new WebSocket.Server({ server })

webSocketServer.on('connection', (ws) => {
    ws.on('message', message => {
        console.log(`Received message: ${message}`)
        ws.send('Hello you, I heard')
    })
})

console.log('connecting to the database...')
database.connect()
.then(() => {
    console.log('connected')
    console.log('starting a server')
    const server = app.listen(serverPort, () => console.log(`Server is running on port ${serverPort}`))

})
.catch(e => console.log(e))