import {assert, expect} from 'chai'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import env from '../src/environment-config'

describe('Trafikverket', function (done) {
  
  describe('Request', function() {
    it('should call request with args', function () {
      //given
      let request = sinon.spy();
      let fs = {'readFileSync': sinon.stub().returns('body')}
      let trafik = proxyquire('../src/index', {
        'request': request,
        'fs': fs
      });
      
      //when
      trafik.getDepartures('test');

      //then
      sinon.assert.calledWithMatch(request, {
        method: 'POST',
        url: env['url'],
        body: 'body'
      })
    })

    it('should handle request failure', function () {
      //given
      let request = sinon.stub()
      let fs = {'readFileSync': sinon.stub().returns('body')}
      let trafik = proxyquire('../src/index', {
        'request': request,
        'fs':fs
      });

      //when
      trafik.getDepartures('test')
        .catch(function (reason) {
          //then
          expect(reason).to.equal('Test error')
        })
        //Catch the AssertionError thrown if the expectation above is not met
        .catch(function (err) {
          done(err)
        })
        
        request.invokeCallback('Test error', undefined, '{"status": "failure"}')
    })
  })

  describe('Sucess responses', function() {
    // var request, trafik

    before(function () {
    })

    it('should handle request success', function (done) {
      let fs = {'readFileSync': sinon.stub().returns('body')}
      let request = sinon.stub()
      let trafik = proxyquire('../src/index', {
        'request': request,
        'fs':fs
      })

      //given
      let response = JSON.stringify({
        'RESPONSE': {
          'RESULT': [
            {
              'TrainAnnouncement': []
            }
          ]
        }
      })

      //when
      trafik.getDepartures('test')
        .then(function (result) {
          expect(result).to.be.empty;
          done()
        })
        //Catch the AssertionError thrown if the expectation above is not met
        .catch(function (err) {
          done(err)
        })

        request.invokeCallback(undefined, undefined, response)
    })
  })
})