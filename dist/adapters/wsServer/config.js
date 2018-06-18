'use strict';

/**
 * The default configuration for the wsServer adapter
 */
module.exports = {
    wsServer: {
        // The name of the event, where the WebSocket messages will be sent for forwarding
        // The messages should have a `topic` property,
        // that holds the name of the WebSocket event in case of inbound messages,
        // or the name of the NATS topic in case of the outbound messages.
        forwarderEvent: process.env.WSSERVER_FORWARDER_EVENT || 'message',

        // If true, the WebSocket server will forward the messages to the target topic
        forwardTopics: process.env.WSSERVER_FORWARD_TOPICS || false
    }
};