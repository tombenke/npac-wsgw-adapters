import { expect } from 'chai'
import config from './config'

describe('wsServer.config', () => {

    it('#defaults', done => {
        const expected = {
            webServer: {
                port: 8001
            }
        }
        
        const defaults = config
        expect(defaults).to.eql(expected)
        done()
    })
})
