import {expect} from 'chai'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import env from '../src/environment-config'

describe('train-station', function () {
  describe('getTrainStationInfo', function () {
    it('should get info from cache', function () {
      //given
      let expectedTrainStation = {
        'name': 'test-name',
        'shortName': 'test-short-name'
      }
      let request = sinon.spy()
      let trainStation = proxyquire('../src/train-station', {
        'request': request,
        'path': sinon.stub(),
        'fs': sinon.stub(),
        './train-stations.json': {
          'test': expectedTrainStation
        }
      })

      // when
      let trainStationInfo = trainStation.getTrainStationInfo('test')

      // then
      sinon.assert.notCalled(request)
      expect(trainStationInfo).to.be.deep.equal(expectedTrainStation)
    })

    it('should handle request failure', function (done) {
      // given
      let request = sinon.stub()
      let trainStation = proxyquire('../src/train-station', {
        'request': request,
        'path': sinon.stub(),
        'fs': sinon.stub()
      })

      // when
      trainStation.getTrainStationInfo('test')
        .catch(function (reason) {
          // then
          expect(reason).to.equal('Test error')
          done()
        })
        // Catch the AssertionError thrown if the expectation above is not met
        .catch(function (err) {
          done(err)
        })
      request.invokeCallback('Test error', undefined, '{"status": "failure"}')
    })

    it('should replace api key and filters', function () {
      let request = sinon.spy()
      let fs = {'readFileSync': sinon.stub().returns('{apikey}|{filters}')}
      let trainStation = proxyquire('../src/train-station', {
        'request': request,
        'path': sinon.stub(),
        'fs': fs
      })
      let expectedBody = env['apiKey'] + '|<EQ name="LocationSignature" value="test"/>'

      // when
      trainStation.getTrainStationInfo('test')

      // then
      sinon.assert.calledWithMatch(request, {
        method: 'POST',
        url: env['url'],
        body: expectedBody
      })
    })
  })
})