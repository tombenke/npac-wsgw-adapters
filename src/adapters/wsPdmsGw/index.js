#!/usr/bin/env node
/*jshint node: true */
'use strict'

import ioClient from 'socket.io-client'
import defaults from './config'
import _ from 'lodash'

/**
 * Setup an inbound topic
 *
 * @arg {Object} container  - The container object
 * @arg {String} topic - The name of the topic
 *
 * @function
 */
const setupInboundTopic = (container, wsClient) => (topic) => {
    // TODO: implement shutdown and enable reconnect.
    if (_.isString(topic) && topic !== '') {
        container.logger.info(`Setup observer to inbound NATS "${topic}" topic.`)
        container.pdms.add({ pubsub$: true, topic: topic }, (data) => {
            container.logger.info(`Forward from NATS(${topic}) data: ${JSON.stringify(data)} to WS(${topic})`)
            wsClient.emit('message', data)
        })
    }
}

/**
 * Setup an outbound topic
 *
 * Setup a websocket client to observe the `<topic>` named events, then publish them to the
 * NATS topic with the same name.
 *
 * @arg {Object} container  - The container object
 * @arg {String} topic - The name of the topic
 *
 * @function
 */
const setupOutboundTopic = (container, wsClient) => (topic) => {
    // TODO: implement shutdown and enable reconnect.
    if (_.isString(topic) && topic != '') {
        container.logger.info(`Setup producer of outbound NATS "${topic}" topic.`)
        wsClient.on(topic, function (data) {
            const msgToForward = _.merge({}, data, { pubsub$: true, topic: topic })
            container.logger.info(`Forward from WS(${topic}) data: ${JSON.stringify(msgToForward)} to NATS(${topic})`)
            container.pdms.act(msgToForward)
        })
    }
}

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
 * @arg {Object} topics - The object, which holds two arrays of topic names, one for the `inbound` topics, and one for the `outbound` ones.
 *
 * @function
 */
const setupTopics = (container, wsClient, topics) => {
    if (_.isArray(topics.inbound)) {
        _.map(topics.inbound, setupInboundTopic(container, wsClient))
    }

    if (_.isArray(topics.outbound)) {
        _.map(topics.outbound, setupOutboundTopic(container, wsClient))
    }
}

/**
 * The startup function of the adapter
 *
 * This function should be registered with the startup phase, then npac will call when the project is starting.
 *
 * @arg {Object} container  - The actual state of the container this adapter will be added
 * @arg {Function} next     - Error-first callback function to pass the result partial container extended with the wsPdmsGw adapter.
 *
 * see also: the `npac.startup` process description.
 *
 * @function
 */
const startup = (container, next) => {
    // Merges the defaults with the config coming from the outer world
    const serviceConfig = _.merge({}, defaults, { wsPdmsGw: container.config.wsPdmsGw || {} })
    container.logger.info('Start up wsPdmsGw adapter')
    container.logger.info(`wsPdmsGw.config: ${JSON.stringify(serviceConfig)}`)

    const serverUri = `http://localhost:${container.config.webServer.port}`
    const wsClient = ioClient(serverUri)

    setupTopics(container, wsClient, serviceConfig.wsPdmsGw.topics)

    // Call next setup function with the context extension
    next(null, {
        config: serviceConfig,
        wsPdmsGw: {
            wsClient: wsClient
        }
    })
}

/**
 * The shutdown function of the service adapter
 *
 * This function should be registered with the shutdown phase, then npac will call when graceful shutdown happens.
 *
 * @arg {Object} container  - The actual state of the container this adapter is running
 * @arg {Function} next     - Error-first callback function to pass the result partial container extended with the wsPdmsGw adapter.
 *
 * see also: the `npac.startup` process description.
 *
 * @function
 */
const shutdown = (container, next) => {
    container.logger.info('Shut down wsPdmsGw adapter')
    container.wsPdmsGw.wsClient.close()
    next(null, null)
}

module.exports = {
    defaults: defaults,
    startup: startup,
    shutdown: shutdown
}
