'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.npacStart = exports.catchExitSignals = exports.removeSignalHandlers = undefined;

var _npac = require('npac');

var _npac2 = _interopRequireDefault(_npac);

var _chai = require('chai');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var removeSignalHandlers = exports.removeSignalHandlers = function removeSignalHandlers() {
    var signals = ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGUSR1', 'SIGUSR2'];
    for (var signal in signals) {
        process.removeAllListeners(signals[signal]);
    }
};

var catchExitSignals = exports.catchExitSignals = function catchExitSignals(sandbox, done) {
    return sandbox.stub(process, 'exit').callsFake(function (signal) {
        console.log("process.exit", signal);
        done();
    });
};

var npacStart = exports.npacStart = function npacStart(adapters, jobs, terminators) {
    return _npac2.default.start(adapters, jobs, terminators, function (err, res) {
        (0, _chai.expect)(err).to.equal(null);
        (0, _chai.expect)(res).to.eql([null]);
        console.log('npac startup process and run jobs successfully finished');

        console.log('Send SIGTERM signal');
        process.kill(process.pid, 'SIGTERM');
    });
};