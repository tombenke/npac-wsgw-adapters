import Hemera from 'nats-hemera'
import nats from 'nats'
import _ from 'lodash'

const registerLoopback = (hemera, outboundTopic, inboundTopic, lbFun = _.identity) => {
    console.log(`register loopback [wsgw] >> [${outboundTopic}] >> lbFun() >> [${inboundTopic}] >> [wsgw]`)
    hemera.add({ pubsub$: true, topic: outboundTopic }, data => {
        const msgToForward = _.merge({}, lbFun(data), { pubsub$: true, topic: inboundTopic })
        console.log(`Forward from WS(${outboundTopic}) data: ${JSON.stringify(msgToForward)} to NATS(${inboundTopic})`)
        hemera.act(msgToForward)
    })
    hemera.add({ pubsub$: true, topic: inboundTopic }, data => {
        console.log(`WS(${inboundTopic}) data: ${JSON.stringify(data)} response arrived`)
    })
}

const registerLoopbacks = (hemera, loopbacks) =>
    _.map(loopbacks, loopback => registerLoopback(hemera, loopback[0], loopback[1], loopback[2] || _.identity))

export const setupNatsLoopbacks = (natsUri, loopbacks) => {
    return new Promise((resolve, reject) => {
        const natsConnection = nats.connect({ url: natsUri })
        const hemera = new Hemera(natsConnection, {
            logLevel: 'debug',
            bloomrun: {
                indexing: 'depth'
            },
            timeout: 2000
        })

        hemera.ready(() => {
            console.log('Hemera is connected')
            registerLoopbacks(hemera, loopbacks)
            console.log('Loopback functions are registered')
            resolve()
        })
    })
}
