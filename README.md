npac-wsgw-adapters
==================

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)
[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coveralls][BadgeCoveralls]][Coveralls]

## About

Adapter modules for websocket servers and websocket-NATS gateways

This project contains the following  [wsgw](https://github.com/tombenke/wsgw) adapters:

- [`wsServer`](src/adapters/wsServer/), a WebSocket server adapter,
- [`wsPdmsGw`](src/adapters/wsPdmsGw/), a WebSocket <-> NATS gateway,
- [`webServer`](src/adapters/webServer/), a very simple, for testing purposes only.

See [wsgw](https://github.com/tombenke/wsgw) project for details.

## Installation

Run the install command:

    npm install --save npac-wsgw-adapters

## Configuration

### The config parameters of the `wsServer` adapter

This module uses the `config.wsServer` property to gain its configuration parameters.

The default parameters can be found in [`src/adapters/wsServer/config.js`](src/adapters/wsServer/config.js):

```JavaScript
    {
        wsServer: {
            // The name of the event, where the WebSocket messages will be sent for forwarding
            // The messages should have a `topic` property,
            // that holds the name of the WebSocket event in case of inbound messages,
            // or the name of the NATS topic in case of the outbound messages.
            forwarderEvent: process.env.WSGW_SERVER_FORWARDER_EVENT || 'message',

            // If true, the WebSocket server will forward the messages to the target topic
            forwardTopics: process.env.WSGW_SERVER_FORWARD_TOPICS || false
        }
    }
```

### The config parameters of the `wsPdmsGw` adapter

This module uses the `config.wsPdmsGw` property to gain its configuration parameters.

The default parameters can be found in [`src/adapters/wsPdmsGw/config.js`](src/adapters/wsPdmsGw/config.js):

```JavaScript
    {
        wsPdmsGw: {
            inbound: [], // The list of inbound NATS topic names
            outbound: [] // The list of outbound NATS topic names
        }
    }
```

### The config parameters of the `webServer` adapter

This module uses the `config.webServer` property to gain its configuration parameters.

The default parameters can be found in [`src/adapters/webServer/config.js`](src/adapters/webServer/config.js):

```JavaScript
    webServer: {
        port: process.env.WSGW_SERVER_PORT || 8001 // The port where the WebSocket server will listen
    }
```

## References

- [wsgw](https://github.com/tombenke/wsgw)
- [npac](http://tombenke.github.io/npac)

---

[npm-badge]: https://badge.fury.io/js/npac-wsgw-adapters.svg
[npm-url]: https://badge.fury.io/js/npac-wsgw-adapters
[travis-badge]: https://api.travis-ci.org/tombenke/npac-wsgw-adapters.svg
[travis-url]: https://travis-ci.org/tombenke/npac-wsgw-adapters
[Coveralls]: https://coveralls.io/github/tombenke/npac-wsgw-adapters?branch=master
[BadgeCoveralls]: https://coveralls.io/repos/github/tombenke/npac-wsgw-adapters/badge.svg?branch=master
