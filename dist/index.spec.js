'use strict';

var _chai = require('chai');

var _index = require('./index');

describe('app', function () {
    it('#wsServer', function (done) {
        console.log(_index.wsServer, _index.wsPdmsGw);
        (0, _chai.expect)(_index.wsServer.defaults.wsServer.forwarderEvent).to.equal('message');
        (0, _chai.expect)(_index.wsServer.defaults.wsServer.forwardTopics).to.equal(false);
        (0, _chai.expect)(_index.wsServer).to.have.property('startup');
        (0, _chai.expect)(_index.wsServer.startup).to.be.a('function');
        (0, _chai.expect)(_index.wsServer).to.have.property('shutdown');
        (0, _chai.expect)(_index.wsServer.shutdown).to.be.a('function');
        done();
    });

    it('#wsPdmsGw', function (done) {
        console.log(_index.wsServer, _index.wsPdmsGw);
        (0, _chai.expect)(_index.wsPdmsGw.defaults.wsPdmsGw.topics.inbound).to.be.an('array');
        (0, _chai.expect)(_index.wsPdmsGw.defaults.wsPdmsGw.topics.outbound).to.be.an('array');
        (0, _chai.expect)(_index.wsPdmsGw).to.have.property('startup');
        (0, _chai.expect)(_index.wsPdmsGw.startup).to.be.a('function');
        (0, _chai.expect)(_index.wsPdmsGw).to.have.property('shutdown');
        (0, _chai.expect)(_index.wsPdmsGw.shutdown).to.be.a('function');
        done();
    });
});