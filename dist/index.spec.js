'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _expect = require('expect');

var _expect2 = _interopRequireDefault(_expect);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _npacNatsAdapter = require('npac-nats-adapter');

var _npacNatsAdapter2 = _interopRequireDefault(_npacNatsAdapter);

var _npacWebserverAdapter = require('npac-webserver-adapter');

var _npacWebserverAdapter2 = _interopRequireDefault(_npacWebserverAdapter);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

var _npac = require('npac');

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('wsServer', function () {
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

    var defaultConfig = _lodash2.default.merge({}, _config2.default, _npacWebserverAdapter2.default.defaults, _lodash2.default.setWith({}, 'webServer.restApiPath', __dirname + '/fixtures/api.yml'), _lodash2.default.setWith({}, 'nats.servers', ['nats://localhost:4222']), _lodash2.default.setWith({}, 'nats.timeout', 2000));

    var makeAdapters = function makeAdapters(config) {
        return [(0, _npac.mergeConfig)(config), _npac.addLogger, _npacNatsAdapter2.default.startup, _npacWebserverAdapter2.default.startup, _index2.default.startup];
    };
    var terminators = [_index2.default.shutdown, _npacWebserverAdapter2.default.shutdown, _npacNatsAdapter2.default.shutdown];

    var setupNatsShortCircuit = function setupNatsShortCircuit(container, inTopic, outTopic) {
        container.logger.info('test: NATS client short-circuit sets up observer to NATS(' + outTopic + ')');
        container.nats.subscribe(outTopic, function (err, data, headers) {
            container.logger.info('test: NatsShortCircuit receives from NATS(' + outTopic + ') data: ' + data);
            container.logger.info('test: NatsShortCircuit sends data: ' + data + ' to NATS(' + inTopic + ')');
            container.nats.publish(inTopic, data);
        });
    };

    it('#wsServer check setup', function (done) {
        (0, _expect2.default)(_index2.default.defaults.wsServer.topics.inbound).toEqual([]);
        (0, _expect2.default)(_index2.default.defaults.wsServer.topics.outbound).toEqual([]);
        (0, _expect2.default)(_index2.default).toHaveProperty('startup');
        (0, _expect2.default)(_typeof(_index2.default.startup)).toBe('function');
        (0, _expect2.default)(_index2.default).toHaveProperty('shutdown');
        (0, _expect2.default)(_typeof(_index2.default.shutdown)).toBe('function');
        done();
    });

    it('message passing NATS-to-WS', function (done) {
        (0, _npac.catchExitSignals)(sandbox, done);

        var testJob = function testJob(container, next) {
            var wsServerUri = 'http://localhost:' + config.webServer.port;
            var topic = 'IN';
            var message = { note: 'text...', number: 42, floatValue: 42.24 };

            container.logger.info('test: consumerClient connects to ' + wsServerUri);
            var consumerClient = (0, _socket2.default)(wsServerUri, { reconnection: false });
            consumerClient.on('connect', function () {
                container.logger.info('test: consumerClient is connected to ' + wsServerUri);
                container.logger.info('test: consumerClient subscribes to WS(' + topic + ') events');
                consumerClient.on(topic, function (data) {
                    container.logger.info('test: consumerClient received data: ' + JSON.stringify(data) + ' from WS(' + topic + ')');
                    (0, _expect2.default)(JSON.parse(data)).toEqual(message);
                    next(null, null);
                });

                container.logger.info('test: producerClient sends data: ' + JSON.stringify(message) + ' to NATS(' + topic + ')');
                container.nats.publish(topic, JSON.stringify(message));
            });
        };

        var config = _lodash2.default.merge({}, defaultConfig, _lodash2.default.setWith({}, 'wsServer.topics.inbound', ['IN']));
        (0, _npac.npacStart)(makeAdapters(config), [testJob], terminators);
    }).timeout(30000);

    it('message passing WS-to-NATS', function (done) {
        (0, _npac.catchExitSignals)(sandbox, done);

        var testJob = function testJob(container, next) {
            var wsServerUri = 'http://localhost:' + config.webServer.port;
            var topic = 'OUT';
            var message = { note: 'text...', number: 42, floatValue: 42.24 };

            container.logger.info('test: consumerClient subscribes to NATS(' + topic + ')');
            container.nats.subscribe(topic, function (err, data, headers) {
                container.logger.info('test: consumerClient received data: ' + JSON.stringify(data) + ' from NATS(' + topic + ')');
                (0, _expect2.default)(JSON.parse(data)).toEqual(message);
                next(null, null);
            });

            container.logger.info('test: producerClient connects to ' + wsServerUri);
            var producerClient = (0, _socket2.default)(wsServerUri, { reconnection: false });
            producerClient.on('connect', function () {
                container.logger.info('test: producerClient is connected to WS(' + wsServerUri + ')');
                container.logger.info('test: producerClient emits data: ' + JSON.stringify(message) + ' to WS(' + topic + ')');
                producerClient.emit(topic, JSON.stringify(message));
            });
        };

        var config = _lodash2.default.merge({}, defaultConfig, _lodash2.default.setWith({}, 'wsServer.topics.outbound', ['OUT']));
        (0, _npac.npacStart)(makeAdapters(config), [testJob], terminators);
    }).timeout(30000);

    it('message sending loopback through NATS', function (done) {
        (0, _npac.catchExitSignals)(sandbox, done);

        var testJob = function testJob(container, next) {
            var serverUri = 'http://localhost:' + config.webServer.port;
            var inTopic = 'IN';
            var outTopic = 'OUT';
            var outMessage = { note: 'text...', number: 42, floatValue: 42.24 };
            var inMessage = outMessage;

            setupNatsShortCircuit(container, inTopic, outTopic);

            container.logger.info('test: consumerClient connects to ' + serverUri);
            var consumerClient = (0, _socket2.default)(serverUri);
            consumerClient.on('connect', function () {
                container.logger.info('test: consumerClient is connected to ' + serverUri);
                container.logger.info('test: consumerClient subscribes to WS(' + inTopic + ') events');
                consumerClient.on(inTopic, function (data) {
                    container.logger.info('test: consumerClient received data: ' + data + ' from WS(' + inTopic + ')');
                    (0, _expect2.default)(JSON.parse(data)).toEqual(inMessage);
                    producerClient.close();
                    consumerClient.close();
                    next(null, null);
                });
                consumerClient.on('disconnect', function (reason) {
                    container.logger.info('test: consumerClient disconnect: ' + reason);
                });

                container.logger.info('test: producerClient connects to ' + serverUri);
                var producerClient = (0, _socket2.default)(serverUri);
                producerClient.on('connect', function () {
                    container.logger.info('test: producerClient is connected to WS(' + serverUri + ')');
                    container.logger.info('test: producerClient emits data: ' + JSON.stringify(outMessage) + ' to WS(' + outTopic + ')');
                    producerClient.emit(outTopic, JSON.stringify(outMessage));
                });
            });
        };

        var config = _lodash2.default.merge({}, defaultConfig, _lodash2.default.setWith({}, 'wsServer.topics.inbound', ['IN']), _lodash2.default.setWith({}, 'wsServer.topics.outbound', ['OUT']));
        (0, _npac.npacStart)(makeAdapters(config), [testJob], terminators);
    }).timeout(30000);
});