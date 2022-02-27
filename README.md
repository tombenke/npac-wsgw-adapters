npac-wsgw-adapters
==================

[![Quality Check](https://github.com/tombenke/npac-wsgw-adapters/actions/workflows/quality_check.yml/badge.svg)](https://github.com/tombenke/npac-wsgw-adapters/actions/workflows/quality_check.yml)
[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)
[![npm version][npm-badge]][npm-url]

## About

This repository holds the following [npac](http://tombenke.github.io/npac) adapter modules for websocket servers and websocket-NATS gateways:

- [`wsServer`](src/adapters/wsServer/), a WebSocket server adapter,
- [`wsPdmsGw`](src/adapters/wsPdmsGw/), a WebSocket <-> NATS gateway.

These adapters are the main parts of the [wsgw](https://github.com/tombenke/wsgw) WebSocket server and client application that has built-in NATS gateway functionality. See [wsgw](https://github.com/tombenke/wsgw) project for details about how it is working.

You can add these adapters to your [npac](http://tombenke.github.io/npac)-based application, but in case you need an off-the-shelf web server with WebSocket that also includes these adapters,and provides the NATS gateway functionality as well, then use [easer](https://www.npmjs.com/package/easer) instead.

The applications that use these adapters, also needs to [npac-pdms-hemera-adapter](https://github.com/tombenke/npac-pdms-hemera-adapter) and [npac-webserver-adapter](https://github.com/tombenke/npac-webserver-adapter/) adapters added to the application container.


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
            forwarderEvent: process.env.WSSERVER_FORWARDER_EVENT || 'message',

            // If true, the WebSocket server will forward the messages to the target topic
            forwardTopics: process.env.WSSERVER_FORWARD_TOPICS || false
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

These configuration parameters can be defined via environment variables as a comma-separated list:
- `WSPDMSGW_INBOUND_TOPICS`: list of inbound topics, for example: "IN1, IN2, IN3",
- `WSPDMSGW_INBOUND_TOPICS`: list of outbound topics, for example: "OUT1,OUT2".


### The config parameters of the `webServer` adapter

This module uses the `config.webServer` property to gain its configuration parameters.

The default parameters can be found in the [`config.js`](https://github.com/tombenke/npac-webserver-adapter/blob/master/src/config.js) file of the [npac-webserver-adapter](https://github.com/tombenke/npac-webserver-adapter/) adapter.

```JavaScript
    webServer: {
        port: process.env.WEBSERVER_PORT || 8080 // The port where the WebSocket server will listen
    }
```

## References

- [wsgw](https://github.com/tombenke/wsgw)
- [npac](http://tombenke.github.io/npac)
- [npac-pdms-hemera-adapter](https://github.com/tombenke/npac-pdms-hemera-adapter)
- [npac-webserver-adapter](https://github.com/tombenke/npac-webserver-adapter/)

---

[npm-badge]: https://badge.fury.io/js/npac-wsgw-adapters.svg
[npm-url]: https://badge.fury.io/js/npac-wsgw-adapters
