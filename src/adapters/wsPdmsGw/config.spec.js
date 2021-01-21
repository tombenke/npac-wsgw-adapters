import { expect } from 'chai'
import config from './config'

before((done) => {
    done()
})
after((done) => {
    done()
})

describe('wsPdmsGw.config', () => {
    it('#defaults', (done) => {
        const expected = {
            wsPdmsGw: {
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
