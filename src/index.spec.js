import { expect } from 'chai'
import sinon from 'sinon'
import _ from 'lodash'
import defaults from './config'
import pdms from 'npac-pdms-hemera-adapter'
import webServer from 'npac-webserver-adapter'
import wsServer from './index'
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

    const defaultConfig = _.merge(
        {},
        defaults,
        webServer.defaults,
        _.setWith({}, 'webServer.restApiPath', __dirname + '/fixtures/api.yml'),
        _.setWith({}, 'pdms.natsUri', 'nats://localhost:4222'),
        _.setWith({}, 'pdms.timeout', 2000)
    )

    const makeAdapters = (config) => [mergeConfig(config), addLogger, pdms.startup, webServer.startup, wsServer.startup]

    const setupPdmsShortCircuit = (container, inTopic, outTopic) => {
        container.logger.info(`test: PdmsShortCircuit sets up observer to NATS(${outTopic})`)
        container.pdms.add({ pubsub$: true, topic: outTopic }, (data) => {
            container.logger.info(
                `test: PdmsShortCircuit receives from NATS(${outTopic}) data: ${JSON.stringify(data)}`
            )
            const msgToForward = _.merge({}, data, { pubsub$: true, topic: inTopic })
            container.logger.info(
                `test: PdmsShortCircuit sends data: ${JSON.stringify(msgToForward)} to NATS(${inTopic})`
            )
            container.pdms.act(msgToForward)
        })
    }

    it('#wsServer', (done) => {
        expect(wsServer.defaults.wsServer.topics.inbound).to.eql([])
        expect(wsServer.defaults.wsServer.topics.outbound).to.eql([])
        expect(wsServer).to.have.property('startup')
        expect(wsServer.startup).to.be.a('function')
        expect(wsServer).to.have.property('shutdown')
        expect(wsServer.shutdown).to.be.a('function')
        done()
    })

    it('message sending loopback through NATS', (done) => {
        catchExitSignals(sandbox, done)

        const testJob = (container, next) => {
            const serverUri = `http://localhost:${config.webServer.port}`
            const inTopic = 'IN'
            const outTopic = 'OUT'
            const outMessage = { note: 'text...', number: 42, floatValue: 42.24 }
            const inMessage = outMessage

            setupPdmsShortCircuit(container, inTopic, outTopic)

            // Subscribe to the 'IN' channel to catch the loopback response
            container.logger.info(`test: consumerClient connects to ${serverUri}`)
            const consumerClient = io(serverUri, { reconnection: false })
            container.logger.info(`test: consumerClient subscribes to WS(${inTopic}) events`)
            consumerClient.on(inTopic, function (data) {
                container.logger.info(`test: consumerClient received data: ${data} from WS(${inTopic})`)
                expect(data).to.eql(inMessage)
                next(null, null)
            })

            // Send a message with topic: 'OUT', that will be forwarded to the 'OUT' channel
            container.logger.info(`test: producerClient connects to ${serverUri}`)
            const producerClient = io(serverUri, { reconnection: false })
            container.logger.info(`test: producerClient emits data: ${JSON.stringify(outMessage)} to WS(${outTopic})`)
            producerClient.emit(outTopic, outMessage)
        }

        const config = _.merge(
            {},
            defaultConfig,
            _.setWith({}, 'wsServer.topics.inbound', ['IN']),
            _.setWith({}, 'wsServer.topics.outbound', ['OUT'])
        )
        npacStart(makeAdapters(config), [testJob], terminators)
    }).timeout(30000)

    const terminators = [wsServer.shutdown, webServer.shutdown, pdms.shutdown]
})
