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
        let stationInfo = handleStationResponse(bodyObj, stationId)
        return resolve(stationInfo)
      }
    )
  })
}

function getTrainStationsInfo (stationIds) {
  let filter = '<OR>' +
    stationIds.map((stationId) => `<EQ name="LocationSignature" value="${stationId}"/>`) +
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
        let stationsInfo = bodyObj.map((stationResponse) => handleStationResponse(stationResponse, null))
        // TODO convert array to map and fill the gaps
        return resolve(stationsInfo)
      }
    )
  })
}

function handleStationResponse (response, defaultName) {
  if (
    !response ||
    !response['RESPONSE'] ||
    !response['RESPONSE']['RESULT'] ||
    !response['RESPONSE']['RESULT'].length ||
    !response['RESPONSE']['RESULT'][0] ||
    !response['RESPONSE']['RESULT'][0]['TrainStation'] ||
    !response['RESPONSE']['RESULT'][0]['TrainStation'][0] ||
    !response['RESPONSE']['RESULT'][0]['TrainStation'][0]['AdvertisedLocationName'] ||
    !response['RESPONSE']['RESULT'][0]['TrainStation'][0]['AdvertisedShortLocationName']
    ) {
    return { 'name': defaultName }
  }
  let trainStationResponse = response['RESPONSE']['RESULT'][0]['TrainStation'][0]
  return {
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
