import {expect} from 'chai'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import env from '../src/environment-config'

describe('train-announcement', function () {
  describe('Request', function () {
    it('should call request with args', function () {
      // given
      let request = sinon.spy()
      let fs = {'readFileSync': sinon.stub().returns('body')}
      let trafik = proxyquire('../src/train-announcement', {
        'request': request,
        'path': sinon.stub().returns('path'),
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
      let trafik = proxyquire('../src/train-announcement', {
        'request': request,
        'path': sinon.stub().returns('path'),
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
      let trafik = proxyquire('../src/train-announcement', {
        'request': request,
        'path': sinon.stub().returns('path'),
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
      let trafik = proxyquire('../src/train-announcement', {
        'request': request,
        'path': sinon.stub().returns('path'),
        'fs': fs
      })

      // when
      trafik.getDepartures('test-origin', 'test-destination')

      // then
      sinon.assert.calledWithMatch(request, {
        method: 'POST',
        url: env['url'],
        body: '<OR>' +
          '<EQ name="ViaToLocation.LocationName" value="test-destination"/>' +
          '<EQ name="ToLocation.LocationName" value="test-destination"/>' +
          '</OR>'
      })
    })
  })

  /**************************
   *
   * RESPONSE HANDLING
   *
   **************************/

  describe('Response handling', function () {
    var fs, request, trafik, getTrainStationsInfoStub

    beforeEach(function () {
      fs = {'readFileSync': sinon.stub().returns('body')}
      request = sinon.stub()
      getTrainStationsInfoStub = sinon.stub()
        .returns(new Promise((resolve, reject) => {
          resolve({})
        }))
      trafik = proxyquire('../src/train-announcement', {
        'request': request,
        'path': sinon.stub().returns('path'),
        'fs': fs,
        './train-station.js': {getTrainStationsInfo: getTrainStationsInfoStub}
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
            'InformationOwner': 'SJ',
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
            }],
            'EstimatedTimeAtLocation': '2017-01-01T11:33',
            'PlannedEstimatedTimeAtLocation': '2017-01-02T12:22',
            'ScheduledDepartureDateTime': '2017-01-03T13:33',
            'Canceled': false,
            'Deviation': ['Deviation 1', 'Deviation 2']
          }
        ]
      }]}})

      getTrainStationsInfoStub.returns(new Promise((resolve, reject) => {
        resolve({
          'test-location': {'name': 'test-location-name'},
          'test-location-1': {'name': 'test-location-name-1'},
          'test-location-2': {'name': 'test-location-name-2'}
        })
      }))

      // when
      trafik.getDepartures('test')
        .then(function (result) {
          expect(result).to.have.lengthOf(1)
          expect(result[0].train).to.equal('test-train')
          expect(result[0].track).to.equal('test-track')
          expect(result[0].canceled).to.equal(false)
          expect(result[0].delayed).to.equal(true)
          expect(result[0].deviation).to.deep.equal(['Deviation 1', 'Deviation 2'])
          expect(result[0].date).to.equal('2017-01-01')
          expect(result[0].time).to.equal('11:22')
          expect(result[0].estimatedDate).to.equal('2017-01-01')
          expect(result[0].estimatedTime).to.equal('11:33')
          expect(result[0].plannedEstimatedDate).to.equal('2017-01-02')
          expect(result[0].plannedEstimatedTime).to.equal('12:22')
          expect(result[0].scheduledDepartureDate).to.equal('2017-01-03')
          expect(result[0].scheduledDepartureTime).to.equal('13:33')
          expect(result[0].destination).to.equal('test-location-name')
          expect(result[0].via).to.deep.equal(['test-location-name-1', 'test-location-name-2'])
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
            'InformationOwner': 'SJ',
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
            'InformationOwner': 'SJ',
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

    it('should not flag as delayed if estimated equals datetime', function (done) {
      // given
      let response = JSON.stringify({'RESPONSE': {'RESULT': [ {
        'TrainAnnouncement': [
          {
            'InformationOwner': 'SJ',
            'AdvertisedTrainIdent': 'test-train',
            'AdvertisedTimeAtLocation': '2017-01-01T11:22',
            'EstimatedTimeAtLocation': '2017-01-01T11:22'
          }
        ]
      }]}})

      // when
      trafik.getDepartures('test')
        .then(function (result) {
          expect(result[0].delayed).to.equal(false)
          done()
        })
        // Catch the AssertionError thrown if the expectation above is not met
        .catch(function (err) {
          done(err)
        })
      request.invokeCallback(undefined, undefined, response)
    })

    it('should preserve unknown time format', function (done) {
      // given
      let response = JSON.stringify({'RESPONSE': {'RESULT': [ {
        'TrainAnnouncement': [
          {
            'InformationOwner': 'SJ',
            'AdvertisedTrainIdent': 'test-train',
            'AdvertisedTimeAtLocation': '2017-01-01T11h22'
          }
        ]
      }]}})

      // when
      trafik.getDepartures('test')
        .then(function (result) {
          expect(result[0].time).to.equal('11h22')
          done()
        })
        // Catch the AssertionError thrown if the expectation above is not met
        .catch(function (err) {
          done(err)
        })
      request.invokeCallback(undefined, undefined, response)
    })

    it('should exclude non SJ results', function (done) {
      // given
      let response = JSON.stringify({'RESPONSE': {'RESULT': [ {
        'TrainAnnouncement': [
          {
            'InformationOwner': 'Pendeltåg',
            'AdvertisedTrainIdent': 'test-train',
            'AdvertisedTimeAtLocation': '2017-01-01T11:22'
          }
        ]
      }]}})

      // when
      trafik.getDepartures('test')
        .then(function (result) {
          expect(result).to.have.lengthOf(0)
          done()
        })
        // Catch the AssertionError thrown if the expectation above is not met
        .catch(function (err) {
          done(err)
        })
      request.invokeCallback(undefined, undefined, response)
    })

    it('should deduplicate results', function (done) {
      // given
      let response = JSON.stringify({'RESPONSE': {'RESULT': [ {
        'TrainAnnouncement': [
          {
            'InformationOwner': 'SJ',
            'AdvertisedTrainIdent': 'test-train',
            'AdvertisedTimeAtLocation': '2017-01-01T11:22'
          },
          {
            'InformationOwner': 'SJ',
            'AdvertisedTrainIdent': 'test-train',
            'AdvertisedTimeAtLocation': '2017-01-01T11:22',
            'Deviation': ['A', 'B', 'C']
          },
          {
            'InformationOwner': 'SJ',
            'AdvertisedTrainIdent': 'test-train',
            'AdvertisedTimeAtLocation': '2017-01-01T11:23'
          }
        ]
      }]}})

      // when
      trafik.getDepartures('test')
        .then(function (result) {
          expect(result).to.have.lengthOf(2)

          expect(result[0].train).to.equal('test-train')
          expect(result[0].date).to.equal('2017-01-01')
          expect(result[0].time).to.equal('11:22')
          expect(result[0].deviation).to.deep.equal(['A', 'B', 'C'])

          expect(result[1].train).to.equal('test-train')
          expect(result[1].date).to.equal('2017-01-01')
          expect(result[1].time).to.equal('11:23')
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
