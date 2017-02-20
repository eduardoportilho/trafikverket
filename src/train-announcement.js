import env from './environment-config.js'
import request from 'request'
import Promise from 'promise'
import path from 'path'
import fs from 'fs'
import trainStations from './train-stations.json'
let xmlRequestFile = path.join(__dirname, 'train-announcement-request.xml')

function getDepartures (fromStationId, toStationId) {
  let optionalFilters = ''
  if (toStationId) {
    optionalFilters += '<EQ name="ViaToLocation.LocationName" value="' + toStationId + '"/>'
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
          var date, time, location, via
          if (anouncement['AdvertisedTimeAtLocation']) {
            let datetime = anouncement['AdvertisedTimeAtLocation'].split('T')
            date = datetime[0]
            time = datetime[1]
          }

          if (anouncement['ToLocation'] && anouncement['ToLocation'].length) {
            location = anouncement['ToLocation'][0]['LocationName']
            if (trainStations[location]) {
              location = trainStations[location].name
            }
          }

          via = []
          if (anouncement['ViaToLocation']) {
            via = anouncement['ViaToLocation'].map(function (station) {
              return station['LocationName']
            })
          }

          return {
            train: anouncement['AdvertisedTrainIdent'],
            track: anouncement['TrackAtLocation'],
            date: date,
            time: time,
            destination: location,
            via: via
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
