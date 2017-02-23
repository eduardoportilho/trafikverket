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

  return new Promise(function (resolve, reject) {
    if (cache[stationId]) {
      return resolve(cache[stationId])
    }
    request(
      { method: 'POST', url: env.url, body: xmlRequest },
      function (err, response, body) {
        if (err) {
          return reject(err)
        }
        let bodyObj = JSON.parse(body)
        let stationsResponse = getStationsResponse(bodyObj)
        if (stationsResponse.length <= 0) {
          return resolve({ 'id': stationId, 'name': stationId })
        }
        let stationInfo = buildStationInfo(stationsResponse[0])
        return resolve(stationInfo)
      }
    )
  })
}

function getTrainStationsInfo (stationIds) {
  let filter = '<OR>' +
    stationIds.map((stationId) => `<EQ name="LocationSignature" value="${stationId}"/>`).join('') +
    '</OR>'
  let xmlRequest = fs.readFileSync(xmlRequestFile)
    .toString()
    .replace('{apikey}', env.apiKey)
    .replace('{filters}', filter)

  return new Promise(function (resolve, reject) {
    request(
      { method: 'POST', url: env.url, body: xmlRequest },
      function (err, response, body) {
        if (err) {
          return reject(err)
        }
        let bodyObj = JSON.parse(body)
        let stationsResponse = getStationsResponse(bodyObj)
        let stationsInfo = stationsResponse
          .map((stationResponse) => buildStationInfo(stationResponse))
          .reduce(function (map, stationInfo) {
            map[stationInfo.id] = stationInfo
            return map
          }, {})
        return resolve(stationsInfo)
      }
    )
  })
}

function getStationsResponse (jsonResponse) {
  if (
    !jsonResponse ||
    !jsonResponse['RESPONSE'] ||
    !jsonResponse['RESPONSE']['RESULT'] ||
    !jsonResponse['RESPONSE']['RESULT'].length ||
    !jsonResponse['RESPONSE']['RESULT'][0] ||
    !jsonResponse['RESPONSE']['RESULT'][0]['TrainStation']
    ) {
    return []
  }
  return jsonResponse['RESPONSE']['RESULT'][0]['TrainStation']
}

function buildStationInfo (trainStationResponse) {
  return {
    'id': trainStationResponse['LocationSignature'],
    'name': trainStationResponse['AdvertisedLocationName'],
    'shortName': trainStationResponse['AdvertisedShortLocationName']
  }
}

const mainExport = {
  getTrainStationInfo: getTrainStationInfo,
  getTrainStationsInfo: getTrainStationsInfo
}

export default mainExport
module.exports = mainExport // for CommonJS compatibility
