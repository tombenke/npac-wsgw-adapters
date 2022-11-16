npac-wsgw-adapters
==================

[![Quality Check](https://github.com/tombenke/npac-wsgw-adapters/actions/workflows/quality_check.yml/badge.svg)](https://github.com/tombenke/npac-wsgw-adapters/actions/workflows/quality_check.yml)
[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)
[![npm version][npm-badge]][npm-url]

## About

This repository holds a [npac](http://tombenke.github.io/npac) adapter module that acts both as a WebSocket server as well as a websocket-NATS gateway.

These adapters are the main parts of the [wsgw](https://github.com/tombenke/wsgw) WebSocket server and client application that has built-in NATS gateway functionality. See [wsgw](https://github.com/tombenke/wsgw) project for details about how it is working.

You can add these adapters to your [npac](http://tombenke.github.io/npac)-based application, but in case you need an off-the-shelf web server with WebSocket that also includes these adapters,and provides the NATS gateway functionality as well, then use [easer](https://www.npmjs.com/package/easer) instead.

The applications that use this adapter, also needs to [npac-nats-adapter](https://github.com/tombenke/npac-nats-adapter) and [npac-webserver-adapter](https://github.com/tombenke/npac-webserver-adapter/) adapters added to the application container.

To learn more about the functions visit the [API docs](https://tombenke.github.io/npac-wsgw-adapters/api/).
See also the test cases in [`src/index.spec.js`](src/index.spec.js) as examples of how to configure and use the module.


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
- [npac-nats-adapter](https://github.com/tombenke/npac-nats-adapter)
- [npac-webserver-adapter](https://github.com/tombenke/npac-webserver-adapter/)

---

[npm-badge]: https://badge.fury.io/js/npac-wsgw-adapters.svg
[npm-url]: https://badge.fury.io/js/npac-wsgw-adapters
