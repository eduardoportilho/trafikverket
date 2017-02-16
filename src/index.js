import env from './environment-config.js'
import request from 'request'
import Promise from 'promise'
import fs from 'fs'

function getDepartures (fromStationId, toStationId) {
  let xmlRequestFile = 'train-announcement-request.xml'
  let optionalFilters = ''
  if (toStationId) {
    optionalFilters += '<EQ name="ToLocation.LocationName" value="' + toStationId + '"/>'
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
          reject(err)
          return
        }

        let bodyObj = JSON.parse(body)
        let anouncements = bodyObj['RESPONSE']['RESULT'][0]['TrainAnnouncement'].map(function (anouncement) {
          var date, time, location
          if (anouncement['AdvertisedTimeAtLocation']) {
            let datetime = anouncement['AdvertisedTimeAtLocation'].split('T')
            date = datetime[0]
            time = datetime[1]
          }

          if (anouncement['ToLocation'] && anouncement['ToLocation'].length) {
            location = anouncement['ToLocation'][0]['LocationName']
          }
          return {
            train: anouncement['AdvertisedTrainIdent'],
            track: anouncement['TrackAtLocation'],
            date: date,
            time: time,
            destination: location
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
