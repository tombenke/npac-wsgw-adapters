'use strict';

var _wsServer = require('./adapters/wsServer/');

var _wsServer2 = _interopRequireDefault(_wsServer);

var _wsPdmsGw = require('./adapters/wsPdmsGw/');

var _wsPdmsGw2 = _interopRequireDefault(_wsPdmsGw);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = {
    wsServer: _wsServer2.default,
    wsPdmsGw: _wsPdmsGw2.default
};