import npac from 'npac'
import { expect } from 'chai'
import sinon from 'sinon'
import _ from 'lodash'
import defaults from './config'
import pdms from 'npac-pdms-hemera-adapter'
import webServer from '../webServer/'
import wsServer from './index'
import { findFilesSync, mergeJsonFilesSync } from 'datafile'
import { removeSignalHandlers, catchExitSignals, npacStart } from '../npacUtils'
import io from 'socket.io-client'

describe('wsServer', () => {
    let sandbox

    beforeEach(done => {
        removeSignalHandlers()
        sandbox = sinon.sandbox.create({})
        done()
    })

    afterEach(done => {
        removeSignalHandlers()
        sandbox.restore()
        done()
    })

    const config = _.merge({}, defaults, webServer.defaults, _.setWith({}, 'wsServer.forwardTopics', true))
    console.log(config)
    const adapters = [
        npac.mergeConfig(config),
        npac.addLogger,
        pdms.startup,
        webServer.startup,
        wsServer.startup
    ]

    const terminators = [
        wsServer.shutdown,
        webServer.shutdown,
        pdms.shutdown
    ]

    it('message sending loopback', (done) => {

        catchExitSignals(sandbox, done)

        const testJob = (container, next) => {
            const serverUri = `http://localhost:${config.webServer.port}`
            const message = { topic: 'XYZ', data: 'data' }
            const clientProducer = io(serverUri)
            const clientConsumer = io(serverUri)

            // Subscribe to the 'XYZ' channel to catch the loopback response
            clientConsumer.on(message.topic, function (data) {
                console.log('data arrived: ', data)
                expect(data).to.eql(message)
                clientProducer.close()
                clientConsumer.close()
                next(null, null)
            })

            // Send a message with topic: 'XYZ', that will be forwarded to the 'XYZ' channel
            clientProducer.emit('message', message)
        }

        npacStart(adapters, [testJob], terminators)
    }).timeout(10000)
})
