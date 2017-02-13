import {expect} from 'chai'
import env from '../src/environment-config'

describe('environment-config', function () {
  it('should use test environment', function () {
    expect(env.apiKey).to.equal('trafikverketApiKey')
    expect(env.url).to.equal('trafikverketApiUrl')
  })
})
