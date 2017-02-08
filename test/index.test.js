import {assert, expect} from 'chai'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import env from '../src/environment-config'

describe('trafikverket', function () {
  
  it('should call request with args', function () {
    //given
    let request = sinon.spy();
    let trafik = proxyquire('../src/index', {'request': request});
    
    //when
    trafik.getDeparturesFrom('test');

    //then
    sinon.assert.calledWithMatch(request, {
      method: 'POST',
      url: env['url'],
      body: 'body'
    })
  })

  it('should handle request success', function () {
    //given
    let request = sinon.stub()
    let trafik = proxyquire('../src/index', {'request': request})

    //when
    trafik.getDeparturesFrom('test')
      .then(function (result) {
        //then
        expect(result).to.equal({'status': 'success'})
      })
      .catch(function (reason) {
        //never
        assert.fail('Unexpected reject: ' + reason)
      })
      request.invokeCallback(undefined, undefined, '{"status": "success"}')
  })

  it('should handle request failure', function () {
    //given
    let request = sinon.stub()
    let trafik = proxyquire('../src/index', {'request': request})

    //when
    trafik.getDeparturesFrom('test')
      .then(function (result) {
        //never
        assert.fail('Unexpected resolve: ' + result)
      })
      .catch(function (reason) {
        //then
        expect(reason).to.equal('Test error')
      })
      request.invokeCallback('Test error', undefined, '{"status": "failure"}')
  })
})