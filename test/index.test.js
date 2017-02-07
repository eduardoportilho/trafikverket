import {expect} from 'chai'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import env from '../src/environment-config'

describe('trafikverket', function () {
  var trafik
  var request

  // before(function () {
  //   request = sinon.stub();
  //   trafik = proxyquire('../src/index', {'browser-request': request});
  // })

  it('should call request with args', function() {
    debugger;
    //given
    request = sinon.spy();
    trafik = proxyquire('../src/index', {'browser-request': request});
    console.log('request', request)
    //when
    trafik.getDeparturesFrom('test').then(function () {});

    //then
    // sinon.assert.called(request)
    sinon.assert.calledWithMatch(request, {
      method: 'POST',
      url: env['url'],
      body: 'body'
    });
  })
})