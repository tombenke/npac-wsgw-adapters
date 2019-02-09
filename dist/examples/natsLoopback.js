'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.setupNatsLoopbacks = undefined;

var _natsHemera = require('nats-hemera');

var _natsHemera2 = _interopRequireDefault(_natsHemera);

var _nats = require('nats');

var _nats2 = _interopRequireDefault(_nats);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var registerLoopback = function registerLoopback(hemera, outboundTopic, inboundTopic) {
    var lbFun = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : _lodash2.default.identity;

    console.log('register loopback [wsgw] >> [' + outboundTopic + '] >> lbFun() >> [' + inboundTopic + '] >> [wsgw]');
    hemera.add({ pubsub$: true, topic: outboundTopic }, function (data) {
        var msgToForward = _lodash2.default.merge({}, lbFun(data), { pubsub$: true, topic: inboundTopic });
        console.log('Forward from WS(' + outboundTopic + ') data: ' + JSON.stringify(msgToForward) + ' to NATS(' + inboundTopic + ')');
        hemera.act(msgToForward);
    });
    hemera.add({ pubsub$: true, topic: inboundTopic }, function (data) {
        console.log('WS(' + inboundTopic + ') data: ' + JSON.stringify(data) + ' response arrived');
    });
};

var registerLoopbacks = function registerLoopbacks(hemera, loopbacks) {
    return _lodash2.default.map(loopbacks, function (loopback) {
        return registerLoopback(hemera, loopback[0], loopback[1], loopback[2] || _lodash2.default.identity);
    });
};

var setupNatsLoopbacks = exports.setupNatsLoopbacks = function setupNatsLoopbacks(natsUri, loopbacks) {
    return new Promise(function (resolve, reject) {
        var natsConnection = _nats2.default.connect({ url: natsUri });
        var hemera = new _natsHemera2.default(natsConnection, {
            logLevel: 'debug',
            bloomrun: {
                indexing: 'depth'
            },
            timeout: 2000
        });

        hemera.ready(function () {
            console.log('Hemera is connected');
            registerLoopbacks(hemera, loopbacks);
            console.log('Loopback functions are registered');
            resolve();
        });
    });
};