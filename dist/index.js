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
var setupInboundTopic = function setupInboundTopic(container, socket) {
    return function (topic) {
        container.logger.info('wsServer: setupInboundTopic adds NATS topic observer to inbound NATS(' + topic + ') topic to forward to WS(' + topic + ') events');
        container.pdms.add({ pubsub$: true, topic: topic }, function (data) {
            container.logger.info('wsServer: Forward data: ' + JSON.stringify(data) + ' from NATS(' + topic + ') topic to WS(' + topic + ') event');
            //socket.emit(topic, data)
            socket.broadcast.emit(topic, data.data);
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
var setupOutboundTopic = function setupOutboundTopic(container, socket) {
    return function (topic) {
        container.logger.info('wsServer: setupOutboundTopic adds WS event observer to outbound WS(' + topic + ') to forward to NATS "' + topic + '" topic');
        socket.on(topic, function (data, confirmCb) {
            var msgToForward = _lodash2.default.merge({}, { pubsub$: true, topic: topic, data: data });
            container.logger.info('wsServer: outbound topic observer forwards data: ' + JSON.stringify(msgToForward) + ' from WS(' + topic + ') event to NATS(' + topic + ') topic');
            container.pdms.act(msgToForward);

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
 */
var setupTopics = function setupTopics(container, socket, topics) {
    container.logger.info('wsServer: setupTopics topics:' + JSON.stringify(topics));
    if (_lodash2.default.isArray(topics.inbound)) {
        _lodash2.default.map(topics.inbound, setupInboundTopic(container, socket));
    }

    if (_lodash2.default.isArray(topics.outbound)) {
        _lodash2.default.map(topics.outbound, setupOutboundTopic(container, socket));
    }
};

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
    container.logger.info('wsServer: Config: ' + JSON.stringify(serviceConfig));
    var io = (0, _socket2.default)(container.webServer.server);

    io.on('connection', function (socket) {
        container.logger.info('wsServer: Client connected ' + socket.client.id);
        setupTopics(container, socket, serviceConfig.wsServer.topics);

        //        socket.on(topic, function (data, confirmCb) {
        //            container.logger.info(
        //                `wsServer: WS(${topic}) forwarderEvent observer forwards ${JSON.stringify(data)} to WS(${topic}) event`
        //            )
        //            socket.broadcast.emit(topic, data)
        //            /*
        //            const targetEv = serviceConfig.wsServer.forwardTopics ? data.topic : forwarderEvent
        //            container.logger.info(
        //                `wsServer: WS(${forwarderEvent}) forwarderEvent observer forwards ${JSON.stringify(
        //                    data
        //                )} to WS(${targetEv}) event`
        //            )
        //            socket.broadcast.emit(targetEv, data)
        //        */
        //            if (_.isFunction(confirmCb)) {
        //                confirmCb(true)
        //            }
        //        })
        //        const topic2 = 'IN'
        //        socket.on(topic2, function (data, confirmCb) {
        //            container.logger.info(
        //                `wsServer: WS(${topic2}) forwarderEvent observer forwards ${JSON.stringify(
        //                    data
        //                )} to WS(${topic2}) event`
        //            )
        //            socket.broadcast.emit(topic2, data)
        //            if (_.isFunction(confirmCb)) {
        //                confirmCb(true)
        //            }
        //        })
    });
    io.on('error', function (err) {
        container.logger.error('wsServer: Server ERROR:', err);
    });
    io.on('disconnection', function (reason) {
        container.logger.info('wsServer: Server DISCONNECTION:', reason);
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
    container.logger.info('wsServer: Shut down wsServer adapter');
    container.logger.info('wsServer: Close wsServer');
    container.wsServer.server.close(function (err) {
        return next(err, null);
    });
};

module.exports = {
    defaults: _config2.default,
    startup: startup,
    shutdown: shutdown
};