import {expect} from 'chai'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import env from '../src/environment-config'

describe('Trafikverket', function () {
  describe('Request', function () {
    it('should call request with args', function () {
      // given
      let request = sinon.spy()
      let fs = {'readFileSync': sinon.stub().returns('body')}
      let trafik = proxyquire('../src/index', {
        'request': request,
        'fs': fs
      })

      // when
      trafik.getDepartures('test')

      // then
      sinon.assert.calledWithMatch(request, {
        method: 'POST',
        url: env['url'],
        body: 'body'
      })
    })

    it('should handle request failure', function (done) {
      // given
      let request = sinon.stub()
      let fs = {'readFileSync': sinon.stub().returns('body')}
      let trafik = proxyquire('../src/index', {
        'request': request,
        'fs': fs
      })

      // when
      trafik.getDepartures('test')
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
  })

  describe('Request queries', function () {
    it('should replace api key and origin', function () {
      let request = sinon.spy()
      let fs = {'readFileSync': sinon.stub().returns('{apikey}|{fromStationId}')}
      let trafik = proxyquire('../src/index', {
        'request': request,
        'fs': fs
      })
      let expectedBody = env['apiKey'] + '|test-origin'

      // when
      trafik.getDepartures('test-origin')

      // then
      sinon.assert.calledWithMatch(request, {
        method: 'POST',
        url: env['url'],
        body: expectedBody
      })
    })

    it('should add optional filter if destination is provided', function () {
      let request = sinon.spy()
      let fs = {'readFileSync': sinon.stub().returns('{optionalFilters}')}
      let trafik = proxyquire('../src/index', {
        'request': request,
        'fs': fs
      })

      // when
      trafik.getDepartures('test-origin', 'test-destination')

      // then
      sinon.assert.calledWithMatch(request, {
        method: 'POST',
        url: env['url'],
        body: '<EQ name="ViaToLocation.LocationName" value="test-destination"/>'
      })
    })
  })

  /**************************
   *
   * RESPONSE HANDLING
   * 
   **************************/

  describe('Response handling', function () {
    var fs, request, trafik

    beforeEach(function () {
      fs = {'readFileSync': sinon.stub().returns('body')}
      request = sinon.stub()
      trafik = proxyquire('../src/index', {
        'request': request,
        'fs': fs
      })
    })

    it('should handle empty response', function (done) {
      // given
      let response = '{}'

      // when
      trafik.getDepartures('test')
        .then(function (result) {
          expect(result).to.be.empty
          done()
        })
        // Catch the AssertionError thrown if the expectation above is not met
        .catch(function (err) {
          done(err)
        })
      request.invokeCallback(undefined, undefined, response)
    })

    it('should handle response without announcements', function (done) {
      // given
      let response = JSON.stringify({
        'RESPONSE': {
          'RESULT': [
            {
              'TrainAnnouncement': []
            }
          ]
        }
      })

      // when
      trafik.getDepartures('test')
        .then(function (result) {
          expect(result).to.be.empty
          done()
        })
        // Catch the AssertionError thrown if the expectation above is not met
        .catch(function (err) {
          done(err)
        })
      request.invokeCallback(undefined, undefined, response)
    })

    it('should handle a complete response', function (done) {
      // given
      let response = JSON.stringify({'RESPONSE': {'RESULT': [ {
        'TrainAnnouncement': [
          {
            'AdvertisedTimeAtLocation': '2017-01-01T11:22',
            'TrackAtLocation': 'test-track',
            'AdvertisedTrainIdent': 'test-train',
            'ToLocation': [{
              'LocationName': 'test-location'
            }],
            'ViaToLocation': [{
              'LocationName': 'test-location-1'
            }, {
              'LocationName': 'test-location-2'
            }]
          }
        ]
      }]}})

      // when
      trafik.getDepartures('test')
        .then(function (result) {
          expect(result).to.have.lengthOf(1)
          expect(result[0].train).to.equal('test-train')
          expect(result[0].track).to.equal('test-track')
          expect(result[0].date).to.equal('2017-01-01')
          expect(result[0].time).to.equal('11:22')
          expect(result[0].destination).to.equal('test-location')
          expect(result[0].via).to.deep.equal(['test-location-1', 'test-location-2'])
          done()
        })
        // Catch the AssertionError thrown if the expectation above is not met
        .catch(function (err) {
          done(err)
        })
      request.invokeCallback(undefined, undefined, response)
    })

    it('should handle a minimum response', function (done) {
      // given
      let response = JSON.stringify({'RESPONSE': {'RESULT': [ {
        'TrainAnnouncement': [
          {
            'AdvertisedTrainIdent': 'test-train'
          }
        ]
      }]}})

      // when
      trafik.getDepartures('test')
        .then(function (result) {
          expect(result).to.have.lengthOf(1)
          expect(result[0].train).to.equal('test-train')
          expect(result[0].track).to.be.undefined
          expect(result[0].date).to.be.undefined
          expect(result[0].time).to.be.undefined
          expect(result[0].destination).to.be.undefined
          done()
        })
        // Catch the AssertionError thrown if the expectation above is not met
        .catch(function (err) {
          done(err)
        })
      request.invokeCallback(undefined, undefined, response)
    })

    it('should handle a empty ToLocation', function (done) {
      // given
      let response = JSON.stringify({'RESPONSE': {'RESULT': [ {
        'TrainAnnouncement': [
          {
            'AdvertisedTrainIdent': 'test-train',
            'ToLocation': []
          }
        ]
      }]}})

      // when
      trafik.getDepartures('test')
        .then(function (result) {
          expect(result).to.have.lengthOf(1)
          expect(result[0].train).to.equal('test-train')
          expect(result[0].track).to.be.undefined
          expect(result[0].date).to.be.undefined
          expect(result[0].time).to.be.undefined
          expect(result[0].destination).to.be.undefined
          done()
        })
        // Catch the AssertionError thrown if the expectation above is not met
        .catch(function (err) {
          done(err)
        })
      request.invokeCallback(undefined, undefined, response)
    })

    it('should use station name if available', function (done) {
      // given
      let response = JSON.stringify({'RESPONSE': {'RESULT': [ {
        'TrainAnnouncement': [
          {
            'AdvertisedTrainIdent': 'test-train',
            'ToLocation': [{
              'LocationName': 'Cst'
            }]
          }
        ]
      }]}})

      // when
      trafik.getDepartures('test')
        .then(function (result) {
          expect(result).to.have.lengthOf(1)
          expect(result[0].train).to.equal('test-train')
          expect(result[0].destination).to.equal('Stockholm Central')
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
