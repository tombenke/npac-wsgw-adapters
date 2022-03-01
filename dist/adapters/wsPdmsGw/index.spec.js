'use strict';

var _chai = require('chai');

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _npacPdmsHemeraAdapter = require('npac-pdms-hemera-adapter');

var _npacPdmsHemeraAdapter2 = _interopRequireDefault(_npacPdmsHemeraAdapter);

var _npacWebserverAdapter = require('npac-webserver-adapter');

var _npacWebserverAdapter2 = _interopRequireDefault(_npacWebserverAdapter);

var _wsServer = require('../wsServer/');

var _wsServer2 = _interopRequireDefault(_wsServer);

var _config3 = require('../wsServer/config');

var _config4 = _interopRequireDefault(_config3);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

var _datafile = require('datafile');

var _npac = require('npac');

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('wsPdmsGw', function () {
    var sandbox = _sinon2.default;

    beforeEach(function (done) {
        (0, _npac.removeSignalHandlers)();
        done();
    });

    afterEach(function (done) {
        (0, _npac.removeSignalHandlers)();
        sandbox.restore();
        done();
    });

    var webServerConfig = _lodash2.default.merge({}, _npacWebserverAdapter2.default.defaults, {
        webServer: {
            restApiPath: __dirname + '../../../fixtures/api.yml'
        }
    });

    var config = _lodash2.default.merge({}, _config2.default, webServerConfig, _config4.default, _lodash2.default.setWith({}, 'pdms.natsUri', /*process.env.PDMS_NATS_URI ||*/'nats://localhost:4222'), _lodash2.default.setWith({}, 'pdms.timeout', /*process.env.PDMS_TIMEOUT ||*/2000), _lodash2.default.setWith({}, 'wsServer.forwardTopics', true), _lodash2.default.setWith({}, 'wsPdmsGw.topics.inbound', ['IN']), _lodash2.default.setWith({}, 'wsPdmsGw.topics.outbound', ['OUT']));

    var adapters = [(0, _npac.mergeConfig)(config), _npac.addLogger, _npacPdmsHemeraAdapter2.default.startup, _npacWebserverAdapter2.default.startup, _wsServer2.default.startup, _index2.default.startup];

    var terminators = [_index2.default.shutdown, _wsServer2.default.shutdown, _npacWebserverAdapter2.default.shutdown, _npacPdmsHemeraAdapter2.default.shutdown];

    var setupPdmsShortCircuit = function setupPdmsShortCircuit(container, inTopic, outTopic) {
        container.pdms.add({ pubsub$: true, topic: outTopic }, function (data) {
            container.logger.info('PdmsShortCircuit receives from NATS(' + outTopic + ') data: ' + JSON.stringify(data));
            var msgToForward = _lodash2.default.merge({}, data, { pubsub$: true, topic: inTopic });
            container.logger.info('PdmsShortCircuit responses data: ' + JSON.stringify(msgToForward) + ' to NATS(' + inTopic + ')');
            container.pdms.act(msgToForward);
        });
    };

    it('message sending loopback through NATS', function (done) {
        (0, _npac.catchExitSignals)(sandbox, done);

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

        (0, _npac.npacStart)(adapters, [testJob], terminators);
    }).timeout(30000);
});