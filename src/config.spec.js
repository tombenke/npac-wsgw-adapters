import { expect } from 'chai'
import config from './config'

before((done) => {
    done()
})
after((done) => {
    done()
})

describe('wsServer.config', () => {
    it('#defaults', (done) => {
        const expected = {
            wsServer: {
                topics: {
                    inbound: [],
                    outbound: []
                }
            }
        }

        const defaults = config
        expect(defaults).to.eql(expected)
        done()
    })
})
