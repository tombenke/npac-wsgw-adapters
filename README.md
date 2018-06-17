npac-wsgw-adapters
==================

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)
[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coveralls][BadgeCoveralls]][Coveralls]

## About

Adapter modules for websocket servers and websocket-NATS gateways

See [wsgw](https://github.com/tombenke/wsgw) project for details.

## Installation

Run the install command:

    npm install --save npac-wsgw-adapters

## Configuration

This module uses the `config.wsPdmsGw` property to gain its configuration parameters.

The default parameters can be found in [`src/config.js`](src/config.js):

```JSON
{
    wsPdmsGw: {
        inbound: [], // The list of inbound NATS topic names
        outbound: [] // The list of outbound NATS topic names
    }
}
```

## Get Help

To learn more about the tool visit the [homepage](http://tombenke.github.io/npac-wsgw-adapters/api/).

## References

- [wsgw](https://github.com/tombenke/wsgw)
- [npac](http://tombenke.github.io/npac)

---

This project was generated from the [ncli-archetype](https://github.com/tombenke/ncli-archetype)
project archetype, using the [kickoff](https://github.com/tombenke/kickoff) utility.

[npm-badge]: https://badge.fury.io/js/npac-wsgw-adapters.svg
[npm-url]: https://badge.fury.io/js/npac-wsgw-adapters
[travis-badge]: https://api.travis-ci.org/tombenke/npac-wsgw-adapters.svg
[travis-url]: https://travis-ci.org/tombenke/npac-wsgw-adapters
[Coveralls]: https://coveralls.io/github/tombenke/npac-wsgw-adapters?branch=master
[BadgeCoveralls]: https://coveralls.io/repos/github/tombenke/npac-wsgw-adapters/badge.svg?branch=master
