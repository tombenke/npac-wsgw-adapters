"use strict";

/**
 * The default configuration for the wsServer adapter
 */
module.exports = {
    wsPdmsGw: {
        topics: {
            inbound: [], // The list of inbound NATS topic names
            outbound: [] // The list of outbound NATS topic names
        }
    }
};