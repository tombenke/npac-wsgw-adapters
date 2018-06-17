#!/usr/bin/env node
/*jshint node: true */
'use strict';

import http from 'http'
import defaults from './config'
import _ from 'lodash'

/**
 * The startup function of the adapter
 *
 * This function should be registered with the startup phase, then npac will call when the project is starting.
 *
 * @arg {Object} container  - The actual state of the container this adapter will be added
 * @arg {Function} next     - Error-first callback function to pass the result partial container extended with the webServer adapter.
 *
 * see also: the `npac.startup` process description.
 *
 * @function
 */
const startup = (container, next) => {
    container.logger.info('Start up webServer adapter')
    // Merges the defaults with the config coming from the outer world
    const serviceConfig = _.merge({}, defaults, { webServer: container.config.webServer || {} })
    const httpServer = http.createServer()
    httpServer.listen(serviceConfig.webServer.port)

    // Call next setup function with the context extension
    next(null, {
        config: serviceConfig,
        webServer: {
            server: httpServer
        }
    })
}

/**
 * The shutdown function of the service adapter
 *
 * This function should be registered with the shutdown phase, then npac will call when graceful shutdown happens.
 *
 * @arg {Object} container  - The actual state of the container this adapter is running
 * @arg {Function} next     - Error-first callback function to pass the result partial container extended with the webServer adapter.
 *
 * see also: the `npac.startup` process description.
 *
 * @function
 */
const shutdown = (container, next) => {
    container.logger.info("Shut down webServer adapter")
    container.webServer.server.close((err, res) => {
        container.logger.info("webServer closed")
        next(null, null)
    })
}

module.exports = {
    defaults: defaults,
    startup: startup,
    shutdown: shutdown
}
