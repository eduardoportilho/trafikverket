import env from './environment-config.js'
import request from 'request'
import Promise from 'promise'
import path from 'path'
import fs from 'fs'
import trainStation from './train-station.js'
let xmlRequestFile = path.join(__dirname, 'train-announcement-request.xml')

function getDepartures (fromStationId, toStationId) {
  let optionalFilters = ''
  if (toStationId) {
    optionalFilters += `<EQ name="ViaToLocation.LocationName" value="${toStationId}"/>`
  }
  let xmlRequest = fs.readFileSync(xmlRequestFile)
    .toString()
    .replace('{apikey}', env.apiKey)
    .replace('{fromStationId}', fromStationId)
    .replace('{optionalFilters}', optionalFilters)

  let requestOptions = {
    method: 'POST',
    url: env.url,
    body: xmlRequest
  }
  return new Promise(function (resolve, reject) {
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
          !bodyObj['RESPONSE']['RESULT'][0]['TrainAnnouncement']
          ) {
          return resolve([])
        }
        let anouncements = bodyObj['RESPONSE']['RESULT'][0]['TrainAnnouncement'].map(function (anouncement) {
          var date, time, toLocation, viaLocations
          if (anouncement['AdvertisedTimeAtLocation']) {
            let datetime = anouncement['AdvertisedTimeAtLocation'].split('T')
            date = datetime[0]
            time = datetime[1]
          }

          if (anouncement['ToLocation'] && anouncement['ToLocation'].length) {
            var stationId = anouncement['ToLocation'][0]['LocationName']
            var stationInfo = trainStation.getTrainStationInfo(stationId)
            toLocation = stationInfo.name
          }

          viaLocations = []
          if (anouncement['ViaToLocation']) {
            viaLocations = anouncement['ViaToLocation'].map(function (station) {
              var stationId = station['LocationName']
              var stationInfo = trainStation.getTrainStationInfo(stationId)
              return stationInfo.name
            })
          }

          return {
            train: anouncement['AdvertisedTrainIdent'],
            track: anouncement['TrackAtLocation'],
            date: date,
            time: time,
            destination: toLocation,
            via: viaLocations
          }
        })
        resolve(anouncements)
      }
    )
  })
}

const mainExport = {
  getDepartures: getDepartures
}

export default mainExport
module.exports = mainExport // for CommonJS compatibility
