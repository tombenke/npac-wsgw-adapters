'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = {
    webServer: {
        port: process.env.WSGW_SERVER_PORT || 8001 // The port where the WebSocket server will listen
    }
};