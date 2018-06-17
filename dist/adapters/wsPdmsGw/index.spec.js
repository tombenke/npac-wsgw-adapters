'use strict';

var _npac = require('npac');

var _npac2 = _interopRequireDefault(_npac);

var _chai = require('chai');

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _npacPdmsHemeraAdapter = require('npac-pdms-hemera-adapter');

var _npacPdmsHemeraAdapter2 = _interopRequireDefault(_npacPdmsHemeraAdapter);

var _webServer = require('../webServer/');

var _webServer2 = _interopRequireDefault(_webServer);

var _wsServer = require('../wsServer/');

var _wsServer2 = _interopRequireDefault(_wsServer);

var _config3 = require('../wsServer/config');

var _config4 = _interopRequireDefault(_config3);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

var _datafile = require('datafile');

var _npacUtils = require('../npacUtils');

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('wsPdmsGw', function () {
    var sandbox = void 0;

    beforeEach(function (done) {
        (0, _npacUtils.removeSignalHandlers)();
        sandbox = _sinon2.default.sandbox.create({});
        done();
    });

    afterEach(function (done) {
        (0, _npacUtils.removeSignalHandlers)();
        sandbox.restore();
        done();
    });

    var config = _lodash2.default.merge({}, _config2.default, _webServer2.default.defaults, _config4.default, _lodash2.default.setWith({}, 'wsServer.forwardTopics', true), _lodash2.default.setWith({}, 'wsPdmsGw.topics.inbound', ['IN']), _lodash2.default.setWith({}, 'wsPdmsGw.topics.outbound', ['OUT']));

    var adapters = [_npac2.default.mergeConfig(config), _npac2.default.addLogger, _npacPdmsHemeraAdapter2.default.startup, _webServer2.default.startup, _wsServer2.default.startup, _index2.default.startup];

    var terminators = [_index2.default.shutdown, _wsServer2.default.shutdown, _webServer2.default.shutdown, _npacPdmsHemeraAdapter2.default.shutdown];

    var setupPdmsShortCircuit = function setupPdmsShortCircuit(container, inTopic, outTopic) {
        container.pdms.add({ pubsub$: true, topic: outTopic }, function (data) {
            container.logger.info('PdmsShortCircuit receives from NATS(' + outTopic + ') data: ' + JSON.stringify(data));
            var msgToForward = _lodash2.default.merge({}, data, { 'pubsub$': true, topic: inTopic });
            container.logger.info('PdmsShortCircuit responses data: ' + JSON.stringify(msgToForward) + ' to NATS(' + inTopic + ')');
            container.pdms.act(msgToForward);
        });
    };

    it('message sending loopback through NATS', function (done) {

        (0, _npacUtils.catchExitSignals)(sandbox, done);

        var testJob = function testJob(container, next) {
            var serverUri = 'http://localhost:' + config.webServer.port;
            var inMessage = { topic: 'IN', data: 'data' };
            var outMessage = { topic: 'OUT', data: 'data' };
            var producerClient = (0, _socket2.default)(serverUri, { reconnection: false });
            var consumerClient = (0, _socket2.default)(serverUri, { reconnection: false });

            setupPdmsShortCircuit(container, 'IN', 'OUT');

            // Subscribe to the 'IN' channel to catch the loopback response
            consumerClient.on('IN', function (data) {
                console.log('consumerClient received from WS(IN): ', data);
                (0, _chai.expect)(data).to.eql(inMessage);
                next(null, null);
            });

            // Send a message with topic: 'OUT', that will be forwarded to the 'OUT' channel
            producerClient.emit('message', outMessage);
            //clientProducer.emit('message', inMessage)
        };

        (0, _npacUtils.npacStart)(adapters, [testJob], terminators);
    }).timeout(10000);
});