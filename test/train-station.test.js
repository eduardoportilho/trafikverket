import {expect} from 'chai'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import env from '../src/environment-config'

describe('train-station', function () {
  describe('getTrainStationInfo', function () {
    describe('Request', function () {
      it('should get info from cache', function (done) {
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
        trainStation.getTrainStationInfo('test')
          .then(function (result) {
            sinon.assert.notCalled(request)
            expect(result).to.be.deep.equal(expectedTrainStation)
            done()
          })
          // Catch the AssertionError thrown if the expectation above is not met
          .catch(function (err) {
            done(err)
          })
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

      it('should create query with multiple filters', function () {
        let request = sinon.spy()
        let fs = {'readFileSync': sinon.stub().returns('{apikey}|{filters}')}
        let trainStation = proxyquire('../src/train-station', {
          'request': request,
          'path': sinon.stub(),
          'fs': fs,
          './train-stations.json': {}
        })
        let expectedBody = env['apiKey'] + '|' +
          '<OR>' +
          '<EQ name="LocationSignature" value="test-1"/>' +
          '<EQ name="LocationSignature" value="test-2"/>' +
          '</OR>'

        // when
        trainStation.getTrainStationsInfo(['test-1', 'test-2'])

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

      it('should handle complete response', function (done) {
        // given
        let response = JSON.stringify({
          'RESPONSE': {
            'RESULT': [
              {
                'TrainStation': [
                  {
                    'LocationSignature': 'test-id',
                    'AdvertisedLocationName': 'test-name',
                    'AdvertisedShortLocationName': 'test-short-name'
                  }
                ]
              }
            ]
          }
        })

        // when
        trainStation.getTrainStationInfo('test-id')
          .then(function (result) {
            expect(result.id).to.equal('test-id')
            expect(result.name).to.equal('test-name')
            expect(result.shortName).to.equal('test-short-name')
            done()
          })
          // Catch the AssertionError thrown if the expectation above is not met
          .catch(function (err) {
            done(err)
          })
        request.invokeCallback(undefined, undefined, response)
      })

      it('should return multiple station info', function (done) {
        // given
        let response = JSON.stringify({
          'RESPONSE': {'RESULT': [{'TrainStation': [
            {
              'LocationSignature': 'test-id-1',
              'AdvertisedLocationName': 'test-name-1',
              'AdvertisedShortLocationName': 'test-short-name-1'
            },
            {
              'LocationSignature': 'test-id-2',
              'AdvertisedLocationName': 'test-name-2',
              'AdvertisedShortLocationName': 'test-short-name-2'
            },
            {
              'LocationSignature': 'test-id-3',
              'AdvertisedLocationName': 'test-name-3',
              'AdvertisedShortLocationName': 'test-short-name-3'
            }
          ]}]}})

        // when
        trainStation.getTrainStationsInfo(['test-id-1', 'test-id-2', 'test-id-3'])
          .then(function (result) {
            expect(Object.keys(result).length).to.equal(3)
            expect(result['test-id-1'].id).to.equal('test-id-1')
            expect(result['test-id-1'].name).to.equal('test-name-1')
            expect(result['test-id-1'].shortName).to.equal('test-short-name-1')

            expect(result['test-id-2'].id).to.equal('test-id-2')
            expect(result['test-id-2'].name).to.equal('test-name-2')
            expect(result['test-id-2'].shortName).to.equal('test-short-name-2')

            expect(result['test-id-3'].id).to.equal('test-id-3')
            expect(result['test-id-3'].name).to.equal('test-name-3')
            expect(result['test-id-3'].shortName).to.equal('test-short-name-3')
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
