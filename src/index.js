let env = require('./environment_config')
let request = require('browser-request')
let Promise = require('promise')

function getDeparturesFrom (stationName) {
  return new Promise(function (resolve, reject) {
    request({
      method: 'POST',
      url: env['url'],
      body: 'body',
      function (err, response, body) {
        if (err) {
          reject(err)
        }
        var bodyObj = JSON.parse(body)
        resolve(bodyObj)
      }
    })
  })
}

const mainExport = {
  getDeparturesFrom: getDeparturesFrom
}

export default mainExport
module.exports = mainExport // for CommonJS compatibility
