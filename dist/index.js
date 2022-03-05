#!/usr/bin/env node

/*jshint node: true */
'use strict';

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Setup an inbound topic
 *
 * @arg {Object} container  - The container object
 * @arg {Object} socket - The socket the server communicates with the connected client through
 * @arg {String} topic - The name of the topic
 *
 * @function
 */
var setupInboundTopic = function setupInboundTopic(container, server) {
    return function (topic) {
        // Add NATS observer
        container.logger.debug('wsServer: setupInboundTopic adds NATS topic observer to inbound NATS(' + topic + ') topic to forward to WS(' + topic + ') events');
        //container.pdms.add({ pubsub$: true, topic: topic }, (data) => {
        container.pdms.subscribe(topic, function (data) {
            container.logger.debug('wsServer: Inbound NATS topic observer received data: ' + JSON.stringify(data) + ' from NATS(' + topic + ')');
            container.logger.debug('wsServer: Inbound NATS topic observer forward data: ' + JSON.stringify(data) + ' from NATS(' + topic + ') topic to WS(' + topic + ') event');
            server.emit(topic, data);
        });
    };
};

/**
 * Setup an outbound topic
 *
 * Setup a websocket client to observe the `<topic>` named events, then publish them to the
 * NATS topic with the same name.
 *
 * @arg {Object} container  - The container object
 * @arg {Object} socket - The socket the server communicates with the connected client through
 * @arg {String} topic - The name of the topic
 *
 * @function
 */
var setupOutboundTopic = function setupOutboundTopic(container, server) {
    return function (topic) {
        container.logger.debug('wsServer: setupOutboundTopic adds WS event observer to outbound WS(' + topic + ') to forward to NATS "' + topic + '" topic');
        server.on(topic, function (data, confirmCb) {
            //const msgToForward = _.merge({}, { pubsub$: true, topic: topic, data: data })
            //container.logger.debug(
            //    `wsServer: Outbound WS topic observer forwards data: ${JSON.stringify(
            //        msgToForward
            //    )} from WS(${topic}) event to NATS(${topic}) topic`
            //)
            //container.pdms.act(msgToForward)
            container.logger.debug('wsServer: Outbound WS topic observer forwards data: ' + JSON.stringify(data) + ' from WS(' + topic + ') event to NATS(' + topic + ') topic');
            container.pdms.publish(topic, data);

            if (_lodash2.default.isFunction(confirmCb)) {
                confirmCb(true);
            }
        });
    };
};

/**
 * Setup observers to the inbound topics, as well as producers to the outbound topics
 *
 * Get the topic names for the inbound topics, then create PDMS subscribers,
 * that receives the messages coming from the NATS messaging middleware of the given topic
 * then forwards them to the websocket channel with the same event name.
 * Do the same for the outbound topics, but the opposite direction, observing the websocket events
 * then publishing towards the corresponding NATS topic.
 *
 * @arg {Object} container  - The container object
 * @arg {Object} socket - The socket the server communicates with the connected client through
 * @arg {Object} topics - The object, which holds two arrays of topic names, one for the `inbound` topics, and one for the `outbound` ones.
 *
 * @function
const setupTopics = (container, server, topics) => {
    container.logger.debug(`wsServer: setupTopics topics:${JSON.stringify(topics)}`)
    if (_.isArray(topics.inbound)) {
        _.map(topics.inbound, setupInboundTopic(container, server))
    }

    if (_.isArray(topics.outbound)) {
        _.map(topics.outbound, setupOutboundTopic(container, server))
    }
}
 */

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
    container.logger.info('wsServer: Start up wsServer adapter');
    container.logger.debug('wsServer: Config: ' + JSON.stringify(serviceConfig));
    var io = (0, _socket2.default)(container.webServer.server);

    if (_lodash2.default.isArray(serviceConfig.wsServer.topics.inbound)) {
        _lodash2.default.map(serviceConfig.wsServer.topics.inbound, setupInboundTopic(container, io));
    }

    io.on('connection', function (socket) {
        container.logger.debug('wsServer: Client ' + socket.client.id + ' connected');

        if (_lodash2.default.isArray(serviceConfig.wsServer.topics.outbound)) {
            _lodash2.default.map(serviceConfig.wsServer.topics.outbound, setupOutboundTopic(container, socket));
        }

        socket.on('disconnect', function () {
            container.logger.debug('wsServer: Client ' + socket.client.id + ' disconnected');
        });
    });
    io.on('error', function (err) {
        container.logger.error('wsServer: Server ERROR:', err);
    });
    io.on('disconnection', function (reason) {
        container.logger.debug('wsServer: Server DISCONNECTION:', reason);
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
    container.logger.info('wsServer: Shutting down wsServer adapter');
    container.logger.debug('wsServer: Close wsServer');
    container.wsServer.server.close(function (err) {
        return next(err, null);
    });
};

module.exports = {
    defaults: _config2.default,
    startup: startup,
    shutdown: shutdown
};