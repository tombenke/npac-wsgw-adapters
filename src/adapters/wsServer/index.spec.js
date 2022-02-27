import { expect } from 'chai'
import sinon from 'sinon'
import _ from 'lodash'
import defaults from './config'
import pdms from 'npac-pdms-hemera-adapter'
import webServer from 'npac-webserver-adapter'
import wsServer from './index'
import { findFilesSync, mergeJsonFilesSync } from 'datafile'
import { addLogger, mergeConfig, removeSignalHandlers, catchExitSignals, npacStart } from 'npac'
import io from 'socket.io-client'

describe('wsServer', () => {
    let sandbox = sinon

    beforeEach((done) => {
        removeSignalHandlers()
        done()
    })

    afterEach((done) => {
        removeSignalHandlers()
        sandbox.restore()
        done()
    })

    const webServerConfig = _.merge(
        {},
        _.setWith({}, 'pdms.natsUri', /*process.env.PDMS_NATS_URI ||*/ 'nats://localhost:4222'),
        _.setWith({}, 'pdms.timeout', /*process.env.PDMS_TIMEOUT ||*/ 2000),
        webServer.defaults,
        {
            webServer: {
                restApiPath: __dirname + '../../../fixtures/api.yml'
            }
        }
    )
    const config = _.merge({}, defaults, webServerConfig, _.setWith({}, 'wsServer.forwardTopics', true))
    console.log(config)
    const adapters = [mergeConfig(config), addLogger, pdms.startup, webServer.startup, wsServer.startup]

    const terminators = [wsServer.shutdown, webServer.shutdown, pdms.shutdown]

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
