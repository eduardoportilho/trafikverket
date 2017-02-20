import {expect} from 'chai'
import index from '../src/index'

describe('Trafikverket', function () {
  describe('API', function () {
    it('should expose getDepartures', function () {
      expect(index.getDepartures).to.be.function
    })
  })
})
