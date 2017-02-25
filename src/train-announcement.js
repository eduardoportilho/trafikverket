import env from './environment-config.js'
import request from 'request'
import Promise from 'promise'
import path from 'path'
import fs from 'fs'
import trainStationService from './train-station.js'
let xmlRequestFile = path.join(__dirname, 'train-announcement-request.xml')

/**
 * Query the departures from a station
 * @param  {string} fromStationId Id of the station of departure
 * @param  {string} toStationId   Id of a station on the route of the train (optional)
 * @param  {string} fromTime      HH:mm:ss Includes trains leaving how long BEFORE the current time? (default: 00:30:00)
 * @param  {string} toTime        HH:mm:ss Includes trains leaving how long AFTER the current time? (default: 03:00:00)
 * @return {array}                Array of departure objects containing the following keys:
 *                                  - train: Train id
 *                                  - track: Track nunber at departing station
 *                                  - date: Date of departure (DD/MM/YYYY)
 *                                  - time: Time of departure (HH:mm:ss)
 *                                  - destination: Name of the final destination station
 *                                  - via: Name of the stations where the train stops
 */
function getDepartures (fromStationId, toStationId, fromTime, toTime) {
  fromTime = fromTime || '00:30:00'
  toTime = toTime || '03:00:00'

  let optionalFilters = ''
  if (toStationId) {
    optionalFilters += `<EQ name="ViaToLocation.LocationName" value="${toStationId}"/>`
  }
  let xmlRequest = fs.readFileSync(xmlRequestFile)
    .toString()
    .replace('{apikey}', env.apiKey)
    .replace('{fromStationId}', fromStationId)
    .replace('{optionalFilters}', optionalFilters)
    .replace('{fromTime}', fromTime)
    .replace('{toTime}', toTime)

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

function getStationIdsFromDepartures (departures) {
  let allStationIds = departures.map(function (departure) {
    return departure.via.concat([departure.destination])
  }).reduce(function (acc, val) {
    return acc.concat(val)
  }, [])
  // unique
  return [...new Set(allStationIds)]
}

function replaceStationIdsForNamesInDepartures (departures, stationsInfo) {
  departures.forEach(function (departure) {
    if (departure.destination) {
      let destinationId = departure.destination
      departure.destination = stationsInfo[destinationId].name
    }

    let viaDestinationIds = departure.via
    departure.via = viaDestinationIds.map(function (viaDestinationId) {
      return stationsInfo[viaDestinationId].name
    })
  })
  return departures
}

function handleDeparturesResponse (jsonResponse) {
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
  return jsonResponse['RESPONSE']['RESULT'][0]['TrainAnnouncement'].map(function (anouncement) {
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
