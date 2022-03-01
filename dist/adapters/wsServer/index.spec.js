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

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

var _datafile = require('datafile');

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

    var webServerConfig = _lodash2.default.merge({}, _lodash2.default.setWith({}, 'pdms.natsUri', /*process.env.PDMS_NATS_URI ||*/'nats://localhost:4222'), _lodash2.default.setWith({}, 'pdms.timeout', /*process.env.PDMS_TIMEOUT ||*/2000), _npacWebserverAdapter2.default.defaults, {
        webServer: {
            restApiPath: __dirname + '../../../fixtures/api.yml'
        }
    });
    var config = _lodash2.default.merge({}, _config2.default, webServerConfig, _lodash2.default.setWith({}, 'wsServer.forwardTopics', true));
    var adapters = [(0, _npac.mergeConfig)(config), _npac.addLogger, _npacPdmsHemeraAdapter2.default.startup, _npacWebserverAdapter2.default.startup, _index2.default.startup];

    var terminators = [_index2.default.shutdown, _npacWebserverAdapter2.default.shutdown, _npacPdmsHemeraAdapter2.default.shutdown];

    it('message sending loopback', function (done) {
        (0, _npac.catchExitSignals)(sandbox, done);

        var testJob = function testJob(container, next) {
            var serverUri = 'http://localhost:' + config.webServer.port;
            var message = { topic: 'XYZ', data: 'data' };
            var clientProducer = (0, _socket2.default)(serverUri);
            var clientConsumer = (0, _socket2.default)(serverUri);

            // Subscribe to the 'XYZ' channel to catch the loopback response
            clientConsumer.on(message.topic, function (data) {
                console.log('data arrived: ', data);
                (0, _chai.expect)(data).to.eql(message);
                clientProducer.close();
                clientConsumer.close();
                next(null, null);
            });

            // Send a message with topic: 'XYZ', that will be forwarded to the 'XYZ' channel
            clientProducer.emit('message', message);
        };

        (0, _npac.npacStart)(adapters, [testJob], terminators);
    }).timeout(10000);
});