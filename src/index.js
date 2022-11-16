#!/usr/bin/env node
/*jshint node: true */
'use strict'

import SocketIo from 'socket.io'
import defaults from './config'
import _ from 'lodash'

/**
 * Setup an inbound topic
 *
 * @arg {Object} container  - The container object
 * @arg {Object} socket - The socket the server communicates with the connected client through
 * @arg {String} topic - The name of the topic
 *
 * @function
 */
const setupInboundTopic = (container, server) => (topic) => {
    // Add NATS observer
    container.logger.debug(
        `wsServer: setupInboundTopic adds NATS topic observer to inbound NATS(${topic}) topic to forward to WS(${topic}) events`
    )
    //container.nats.add({ pubsub$: true, topic: topic }, (data) => {
    container.nats.subscribe(topic, (err, payload, headers) => {
        container.logger.debug(`wsServer: Inbound NATS topic observer received payload: ${payload} from NATS(${topic})`)
        container.logger.debug(
            `wsServer: Inbound NATS topic observer forward payload: ${payload} from NATS(${topic}) topic to WS(${topic}) event`
        )
        server.emit(topic, payload)
    })
}

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
const setupOutboundTopic = (container, server) => (topic) => {
    container.logger.debug(
        `wsServer: setupOutboundTopic adds WS event observer to outbound WS(${topic}) to forward to NATS "${topic}" topic`
    )
    server.on(topic, (payload, confirmCb) => {
        container.logger.debug(
            `wsServer: Outbound WS topic observer forwards data: ${payload} from WS(${topic}) event to NATS(${topic}) topic`
        )
        container.nats.publish(topic, payload)

        if (_.isFunction(confirmCb)) {
            confirmCb(true)
        }
    })
}

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
const startup = (container, next) => {
    // Merges the defaults with the config coming from the outer world
    const serviceConfig = _.merge({}, defaults, { wsServer: container.config.wsServer || {} })
    container.logger.info('wsServer: Start up wsServer adapter')
    container.logger.debug(`wsServer: Config: ${JSON.stringify(serviceConfig)}`)
    const io = SocketIo(container.webServer.server)

    if (_.isArray(serviceConfig.wsServer.topics.inbound)) {
        _.map(serviceConfig.wsServer.topics.inbound, setupInboundTopic(container, io))
    }

    io.on('connection', (socket) => {
        container.logger.debug(`wsServer: Client ${socket.client.id} connected`)

        if (_.isArray(serviceConfig.wsServer.topics.outbound)) {
            _.map(serviceConfig.wsServer.topics.outbound, setupOutboundTopic(container, socket))
        }

        socket.on('disconnect', () => {
            container.logger.debug(`wsServer: Client ${socket.client.id} disconnected`)
        })
    })
    io.on('error', (err) => {
        container.logger.error('wsServer: Server ERROR:', err)
    })
    io.on('disconnection', (reason) => {
        container.logger.debug('wsServer: Server DISCONNECTION:', reason)
    })

    // Call next setup function with the context extension
    next(null, {
        config: serviceConfig,
        wsServer: {
            server: io
        }
    })
}

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
const shutdown = (container, next) => {
    container.logger.info('wsServer: Shutting down wsServer adapter')
    container.logger.debug('wsServer: Close wsServer')
    container.wsServer.server.close((err) => next(err, null))
}

module.exports = {
    defaults: defaults,
    startup: startup,
    shutdown: shutdown
}
