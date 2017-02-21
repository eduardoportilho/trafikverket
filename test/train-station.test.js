import {expect} from 'chai'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import env from '../src/environment-config'

describe('train-station', function () {
  describe('getTrainStationInfo', function () {
    describe('Request', function () {
      it('should get info from cache', function () {
        // given
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
          'fs': sinon.stub(),
          './train-stations.json': {}
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
          'fs': fs,
          './train-stations.json': {}
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

    describe('Response handling', function () {
      var fs, request, trainStation

      beforeEach(function () {
        fs = {'readFileSync': sinon.stub().returns('body')}
        request = sinon.stub()
        trainStation = proxyquire('../src/train-station', {
          'request': request,
          'path': sinon.stub().returns('path'),
          'fs': fs,
          './train-stations.json': {}
        })
      })

      it('should handle empty response', function (done) {
        // given
        let response = '{}'

        // when
        trainStation.getTrainStationInfo('test')
          .then(function (result) {
            expect(result.name).to.equal('test')
            done()
          })
          // Catch the AssertionError thrown if the expectation above is not met
          .catch(function (err) {
            done(err)
          })
        request.invokeCallback(undefined, undefined, response)
      })

      it('should handle response without trains', function (done) {
        // given
        let response = JSON.stringify({
          'RESPONSE': {
            'RESULT': [
              {
                'TrainStation': []
              }
            ]
          }
        })

        // when
        trainStation.getTrainStationInfo('test')
          .then(function (result) {
            expect(result.name).to.equal('test')
            done()
          })
          // Catch the AssertionError thrown if the expectation above is not met
          .catch(function (err) {
            done(err)
          })
        request.invokeCallback(undefined, undefined, response)
      })
    })
  })
})
