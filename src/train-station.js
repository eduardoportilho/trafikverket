import env from './environment-config.js'
import request from 'request'
import Promise from 'promise'
import path from 'path'
import fs from 'fs'
import cache from './train-stations.json'
let xmlRequestFile = path.join(__dirname, 'train-station.xml')

function getTrainStationInfo (stationId) {
  let xmlRequest = fs.readFileSync(xmlRequestFile)
    .toString()
    .replace('{apikey}', env.apiKey)
    .replace('{filters}', `<EQ name="LocationSignature" value="${stationId}"/>`)

  let requestOptions = {
    method: 'POST',
    url: env.url,
    body: xmlRequest
  }
  return new Promise(function (resolve, reject) {
    if (cache[stationId]) {
      return resolve(cache[stationId])
    }
    request(
      requestOptions,
      function (err, response, body) {
        if (err) {
          return reject(err)
        }
        let bodyObj = JSON.parse(body)
        if (
          !bodyObj ||
          !bodyObj['RESPONSE'] ||
          !bodyObj['RESPONSE']['RESULT'] ||
          !bodyObj['RESPONSE']['RESULT'].length ||
          !bodyObj['RESPONSE']['RESULT'][0] ||
          !bodyObj['RESPONSE']['RESULT'][0]['TrainStation'] ||
          !bodyObj['RESPONSE']['RESULT'][0]['TrainStation'][0] ||
          !bodyObj['RESPONSE']['RESULT'][0]['TrainStation'][0]['AdvertisedLocationName'] ||
          !bodyObj['RESPONSE']['RESULT'][0]['TrainStation'][0]['AdvertisedShortLocationName']
          ) {
          return resolve({
            'name': stationId
          })
        }
        let trainStationResponse = bodyObj['RESPONSE']['RESULT'][0]['TrainStation'][0]
        return resolve({
          'name': trainStationResponse['AdvertisedLocationName'],
          'shortName': trainStationResponse['AdvertisedShortLocationName']
        })
      }
    )
  })
}

// function findTrainStationsByNameLike(partOfStationName) {
//       <LIKE name="AdvertisedLocationName" value="Stockholm C" />
// }

const mainExport = {
  getTrainStationInfo: getTrainStationInfo
}

export default mainExport
module.exports = mainExport // for CommonJS compatibility
