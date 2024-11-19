import expect from 'expect'
import sinon from 'sinon'
import _ from 'lodash'
import defaults from './config'
import nats from 'npac-nats-adapter'
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
        _.setWith({}, 'nats.servers', ['nats://localhost:4222']),
        _.setWith({}, 'nats.timeout', 2000)
    )

    const makeAdapters = (config) => [mergeConfig(config), addLogger, nats.startup, webServer.startup, wsServer.startup]
    const terminators = [wsServer.shutdown, webServer.shutdown, nats.shutdown]

    const setupNatsShortCircuit = (container, inTopic, outTopic) => {
        container.logger.info(`test: NATS client short-circuit sets up observer to NATS(${outTopic})`)
        container.nats.subscribe(outTopic, (err, data, headers) => {
            container.logger.info(`test: NatsShortCircuit receives from NATS(${outTopic}) data: ${data}`)
            container.logger.info(`test: NatsShortCircuit sends data: ${data} to NATS(${inTopic})`)
            container.nats.publish(inTopic, data)
        })
    }

    it('#wsServer check setup', (done) => {
        expect(wsServer.defaults.wsServer.topics.inbound).toEqual([])
        expect(wsServer.defaults.wsServer.topics.outbound).toEqual([])
        expect(wsServer).toHaveProperty('startup')
        expect(typeof wsServer.startup).toBe('function')
        expect(wsServer).toHaveProperty('shutdown')
        expect(typeof wsServer.shutdown).toBe('function')
        done()
    })

    it('message passing NATS-to-WS', (done) => {
        catchExitSignals(sandbox, done)

        const testJob = (container, next) => {
            const wsServerUri = `http://localhost:${config.webServer.port}`
            const topic = 'IN'
            const message = { note: 'text...', number: 42, floatValue: 42.24 }

            container.logger.info(`test: consumerClient connects to ${wsServerUri}`)
            const consumerClient = io(wsServerUri, { reconnection: false })
            consumerClient.on('connect', () => {
                container.logger.info(`test: consumerClient is connected to ${wsServerUri}`)
                container.logger.info(`test: consumerClient subscribes to WS(${topic}) events`)
                consumerClient.on(topic, function (data) {
                    container.logger.info(
                        `test: consumerClient received data: ${JSON.stringify(data)} from WS(${topic})`
                    )
                    expect(JSON.parse(data)).toEqual(message)
                    next(null, null)
                })

                container.logger.info(`test: producerClient sends data: ${JSON.stringify(message)} to NATS(${topic})`)
                container.nats.publish(topic, JSON.stringify(message))
            })
        }

        const config = _.merge({}, defaultConfig, _.setWith({}, 'wsServer.topics.inbound', ['IN']))
        npacStart(makeAdapters(config), [testJob], terminators)
    }).timeout(30000)

    it('message passing WS-to-NATS', (done) => {
        catchExitSignals(sandbox, done)

        const testJob = (container, next) => {
            const wsServerUri = `http://localhost:${config.webServer.port}`
            const topic = 'OUT'
            const message = { note: 'text...', number: 42, floatValue: 42.24 }

            container.logger.info(`test: consumerClient subscribes to NATS(${topic})`)
            container.nats.subscribe(topic, (err, data, headers) => {
                container.logger.info(`test: consumerClient received data: ${JSON.stringify(data)} from NATS(${topic})`)
                expect(JSON.parse(data)).toEqual(message)
                next(null, null)
            })

            container.logger.info(`test: producerClient connects to ${wsServerUri}`)
            const producerClient = io(wsServerUri, { reconnection: false })
            producerClient.on('connect', () => {
                container.logger.info(`test: producerClient is connected to WS(${wsServerUri})`)
                container.logger.info(`test: producerClient emits data: ${JSON.stringify(message)} to WS(${topic})`)
                producerClient.emit(topic, JSON.stringify(message))
            })
        }

        const config = _.merge({}, defaultConfig, _.setWith({}, 'wsServer.topics.outbound', ['OUT']))
        npacStart(makeAdapters(config), [testJob], terminators)
    }).timeout(30000)

    it('message sending loopback through NATS', (done) => {
        catchExitSignals(sandbox, done)

        const testJob = (container, next) => {
            const serverUri = `http://localhost:${config.webServer.port}`
            const inTopic = 'IN'
            const outTopic = 'OUT'
            const outMessage = { note: 'text...', number: 42, floatValue: 42.24 }
            const inMessage = outMessage

            setupNatsShortCircuit(container, inTopic, outTopic)

            container.logger.info(`test: consumerClient connects to ${serverUri}`)
            const consumerClient = io(serverUri)
            consumerClient.on('connect', () => {
                container.logger.info(`test: consumerClient is connected to ${serverUri}`)
                container.logger.info(`test: consumerClient subscribes to WS(${inTopic}) events`)
                consumerClient.on(inTopic, function (data) {
                    container.logger.info(`test: consumerClient received data: ${data} from WS(${inTopic})`)
                    expect(JSON.parse(data)).toEqual(inMessage)
                    producerClient.close()
                    consumerClient.close()
                    next(null, null)
                })
                consumerClient.on('disconnect', (reason) => {
                    container.logger.info(`test: consumerClient disconnect: ${reason}`)
                })

                container.logger.info(`test: producerClient connects to ${serverUri}`)
                const producerClient = io(serverUri)
                producerClient.on('connect', () => {
                    container.logger.info(`test: producerClient is connected to WS(${serverUri})`)
                    container.logger.info(
                        `test: producerClient emits data: ${JSON.stringify(outMessage)} to WS(${outTopic})`
                    )
                    producerClient.emit(outTopic, JSON.stringify(outMessage))
                })
            })
        }

        const config = _.merge(
            {},
            defaultConfig,
            _.setWith({}, 'wsServer.topics.inbound', ['IN']),
            _.setWith({}, 'wsServer.topics.outbound', ['OUT'])
        )
        npacStart(makeAdapters(config), [testJob], terminators)
    }).timeout(30000)
})
