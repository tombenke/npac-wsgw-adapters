import path from 'path'

module.exports = {
    webServer: {
        port: process.env.WEBSERVER_PORT || 8001 // The port where the WebSocket server will listen
    }
}
