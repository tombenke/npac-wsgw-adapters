#!/usr/bin/env node

/*jshint node: true */
'use strict';

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The startup function of the adapter
 *
 * This function should be registered with the startup phase, then npac will call when the project is starting.
 *
 * @arg {Object} container  - The actual state of the container this adapter will be added
 * @arg {Function} next     - Error-first callback function to pass the result partial container extended with the wsServer adapter.
 *
 * see also: the `npac.startup` process description.
 *
 * @function
 */
var startup = function startup(container, next) {
    // Merges the defaults with the config coming from the outer world
    var serviceConfig = _lodash2.default.merge({}, _config2.default, { wsServer: container.config.wsServer || {} });
    var forwarderEvent = serviceConfig.wsServer.forwarderEvent;
    container.logger.info('Start up wsServer adapter');
    container.logger.info('wsServer.config: ' + JSON.stringify(serviceConfig));
    //const httpServer = http.createServer()
    //httpServer.listen(serviceConfig.webServer.port)
    //const io = SocketIo(httpServer)
    var io = (0, _socket2.default)(container.webServer.server);

    io.on('connection', function (socket) {
        container.logger.info('Client connected');
        socket.on(forwarderEvent, function (data, confirmCb) {
            var targetEv = serviceConfig.wsServer.forwardTopics ? data.topic : forwarderEvent;
            container.logger.info('[' + forwarderEvent + '] >> ' + JSON.stringify(data) + ' >> [' + targetEv + ']');
            socket.broadcast.emit(targetEv, data);
            if (_lodash2.default.isFunction(confirmCb)) {
                confirmCb(true);
            }
        });
    });
    io.on('error', function (err) {
        container.logger.error('Server ERROR:', err);
    });
    io.on('disconnection', function (reason) {
        container.logger.info('Server DISCONNECTION:', reason);
    });

    // Call next setup function with the context extension
    next(null, {
        config: serviceConfig,
        wsServer: {
            server: io
        }
    });
};

/**
 * The shutdown function of the service adapter
 *
 * This function should be registered with the shutdown phase, then npac will call when graceful shutdown happens.
 *
 * @arg {Object} container  - The actual state of the container this adapter is running
 * @arg {Function} next     - Error-first callback function to pass the result partial container extended with the wsServer adapter.
 *
 * see also: the `npac.startup` process description.
 *
 * @function
 */
var shutdown = function shutdown(container, next) {
    container.logger.info('Shut down wsServer adapter');
    container.wsServer.server.close(function (err) {
        return next(err, null);
    });
};

module.exports = {
    defaults: _config2.default,
    startup: startup,
    shutdown: shutdown
};