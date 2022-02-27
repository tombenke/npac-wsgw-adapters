import { expect } from 'chai'
import sinon from 'sinon'
import _ from 'lodash'
import defaults from './config'
import pdms from 'npac-pdms-hemera-adapter'
import webServer from 'npac-webserver-adapter'
import wsServer from '../wsServer/'
import wsServerConfig from '../wsServer/config'
import wsPdmsGw from './index'
import { findFilesSync, mergeJsonFilesSync } from 'datafile'
import { addLogger, mergeConfig, removeSignalHandlers, catchExitSignals, npacStart } from 'npac'
import io from 'socket.io-client'

describe('wsPdmsGw', () => {
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

    const webServerConfig = _.merge({}, webServer.defaults, {
        webServer: {
            restApiPath: __dirname + '../../../fixtures/api.yml'
        }
    })

    const config = _.merge(
        {},
        defaults,
        webServerConfig,
        wsServerConfig,
        _.setWith({}, 'pdms.natsUri', /*process.env.PDMS_NATS_URI ||*/ 'nats://localhost:4222'),
        _.setWith({}, 'pdms.timeout', /*process.env.PDMS_TIMEOUT ||*/ 2000),
        _.setWith({}, 'wsServer.forwardTopics', true),
        _.setWith({}, 'wsPdmsGw.topics.inbound', ['IN']),
        _.setWith({}, 'wsPdmsGw.topics.outbound', ['OUT'])
    )

    const adapters = [
        mergeConfig(config),
        addLogger,
        pdms.startup,
        webServer.startup,
        wsServer.startup,
        wsPdmsGw.startup
    ]

    const terminators = [wsPdmsGw.shutdown, wsServer.shutdown, webServer.shutdown, pdms.shutdown]

    const setupPdmsShortCircuit = (container, inTopic, outTopic) => {
        container.pdms.add({ pubsub$: true, topic: outTopic }, (data) => {
            container.logger.info(`PdmsShortCircuit receives from NATS(${outTopic}) data: ${JSON.stringify(data)}`)
            const msgToForward = _.merge({}, data, { pubsub$: true, topic: inTopic })
            container.logger.info(
                `PdmsShortCircuit responses data: ${JSON.stringify(msgToForward)} to NATS(${inTopic})`
            )
            container.pdms.act(msgToForward)
        })
    }

    it('message sending loopback through NATS', (done) => {
        catchExitSignals(sandbox, done)

        const testJob = (container, next) => {
            const serverUri = `http://localhost:${config.webServer.port}`
            const inMessage = { topic: 'IN', data: 'data' }
            const outMessage = { topic: 'OUT', data: 'data' }
            const producerClient = io(serverUri, { reconnection: false })
            const consumerClient = io(serverUri, { reconnection: false })

            setupPdmsShortCircuit(container, 'IN', 'OUT')

            // Subscribe to the 'IN' channel to catch the loopback response
            consumerClient.on('IN', function (data) {
                console.log('consumerClient received from WS(IN): ', data)
                expect(data).to.eql(inMessage)
                next(null, null)
            })

            // Send a message with topic: 'OUT', that will be forwarded to the 'OUT' channel
            producerClient.emit('message', outMessage)
            //clientProducer.emit('message', inMessage)
        }

        npacStart(adapters, [testJob], terminators)
    }).timeout(30000)
})
