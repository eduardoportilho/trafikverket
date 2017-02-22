import env from './environment-config.js'
import request from 'request'
import Promise from 'promise'
import path from 'path'
import fs from 'fs'
import trainStationService from './train-station.js'
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

  return new Promise(function (resolve, reject) {
    request(
      {method: 'POST', url: env.url, body: xmlRequest},
      function (err, response, body) {
        if (err) {
          return reject(err)
        }
        let bodyObj = JSON.parse(body)
        let departures = handleDeparturesResponse(bodyObj)
        resolve(departures)
      }
    )
  }).then(function (departures) {
    let stationIds = getStationIdsFromDepartures(departures)
    return trainStationService.getTrainStationsInfo(stationIds)
      .then(function (stationsInfo) {
        return replaceStationIdsForNamesInDepartures(departures, stationsInfo)
      })
  })
}

function getStationIdsFromDepartures(departures) {
  let allStationIds = departures.map(function (departure) {
    return departure.via.concat([departure.destination])
  }).reduce(function (acc, val) {
    return acc.concat(val)
  }, [])
  //unique
  return [...new Set(allStationIds)];
}

function replaceStationIdsForNamesInDepartures(departures, stationsInfo) {
  departures.forEach(function (departure) {
    let destinationId = departure.destination
    departure.destination = stationsInfo[destinationId].name

    let viaDestinationIds = departure.via
    departure.via = viaDestinationIds.map(function (viaDestinationId) {
      return stationsInfo[viaDestinationId].name
    })
  })
  return departures
}

function handleDeparturesResponse(jsonResponse) {
  if (
    !jsonResponse ||
    !jsonResponse['RESPONSE'] ||
    !jsonResponse['RESPONSE']['RESULT'] ||
    !jsonResponse['RESPONSE']['RESULT'].length ||
    !jsonResponse['RESPONSE']['RESULT'][0] ||
    !jsonResponse['RESPONSE']['RESULT'][0]['TrainAnnouncement']
    ) {
    return []
  }
  let anouncements = jsonResponse['RESPONSE']['RESULT'][0]['TrainAnnouncement'].map(function (anouncement) {
    var date, time, toLocation, viaLocations
    if (anouncement['AdvertisedTimeAtLocation']) {
      let datetime = anouncement['AdvertisedTimeAtLocation'].split('T')
      date = datetime[0]
      time = datetime[1]
    }

    if (anouncement['ToLocation'] && anouncement['ToLocation'].length) {
      toLocation = anouncement['ToLocation'][0]['LocationName']
    }

    viaLocations = []
    if (anouncement['ViaToLocation']) {
      viaLocations = anouncement['ViaToLocation'].map(function (station) {
        return station['LocationName']
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
}

const mainExport = {
  getDepartures: getDepartures
}

export default mainExport
module.exports = mainExport // for CommonJS compatibility
