import { expect } from 'chai'
import { wsServer, wsPdmsGw } from './index'

describe('app', () => {
    it('#wsServer', (done) => {
        console.log(wsServer, wsPdmsGw)
        expect(wsServer.defaults.wsServer.forwarderEvent).to.equal('message')
        expect(wsServer.defaults.wsServer.forwardTopics).to.equal(false)
        expect(wsServer).to.have.property('startup')
        expect(wsServer.startup).to.be.a('function')
        expect(wsServer).to.have.property('shutdown')
        expect(wsServer.shutdown).to.be.a('function')
        done()
    })

    it('#wsPdmsGw', (done) => {
        console.log(wsServer, wsPdmsGw)
        expect(wsPdmsGw.defaults.wsPdmsGw.topics.inbound).to.be.an('array')
        expect(wsPdmsGw.defaults.wsPdmsGw.topics.outbound).to.be.an('array')
        expect(wsPdmsGw).to.have.property('startup')
        expect(wsPdmsGw.startup).to.be.a('function')
        expect(wsPdmsGw).to.have.property('shutdown')
        expect(wsPdmsGw.shutdown).to.be.a('function')
        done()
    })
})
