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
 *                                  - train {string}: Train id
 *                                  - track {string}: Track nunber at departing station
 *                                  - cancelled {boolean}: Departure cancelled?
 *                                  - delayed {boolean}: Departure delayed?
 *                                  - deviation {string[]}: Deiations, for example: "Bus Replacement"
 *                                  - date {string}: Date of departure (DD/MM/YYYY)
 *                                  - time {string}: Time of departure (HH:mm:ss)
 *                                  - estimatedDate {string}: Estimated date of departure (DD/MM/YYYY)
 *                                  - estimatedTime {string}: Estimated time of departure (HH:mm:ss)
 *                                  - plannedEstimatedDate {string}: Planned delayed departure date (DD/MM/YYYY)
 *                                  - plannedEstimatedTime {string}: Planned delayed departure time (HH:mm:ss)
 *                                  - scheduledDepartureDate {string}: The train's announced departure date (DD/MM/YYYY)
 *                                  - scheduledDepartureTime {string}: The train's announced departure time (HH:mm:ss)
 *                                  - destination {string}: Name of the final destination station
 *                                  - via {string[]}: Name of the stations where the train stops
 */
function getDepartures (fromStationId, toStationId, fromTime, toTime) {
  fromTime = fromTime || '00:30:00'
  toTime = toTime || '03:00:00'

  let optionalFilters = ''
  if (toStationId) {
    optionalFilters += '<OR>' +
      `<EQ name="ViaToLocation.LocationName" value="${toStationId}"/>` +
      `<EQ name="ToLocation.LocationName" value="${toStationId}"/>` +
      '</OR>'
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
    let date,
      time,
      estimatedDate,
      estimatedTime,
      plannedEstimatedDate,
      plannedEstimatedTime,
      scheduledDepartureDate,
      scheduledDepartureTime,
      toLocation,
      viaLocations,
      delayed

    if (anouncement['AdvertisedTimeAtLocation']) {
      let datetime = anouncement['AdvertisedTimeAtLocation'].split('T')
      date = datetime[0]
      time = datetime[1]
    }

    delayed = false
    if (anouncement['EstimatedTimeAtLocation']) {
      let estimatedDatetime = anouncement['EstimatedTimeAtLocation'].split('T')
      estimatedDate = estimatedDatetime[0]
      estimatedTime = estimatedDatetime[1]
      delayed = estimatedDate !== date || estimatedTime !== time
    }

    if (anouncement['PlannedEstimatedTimeAtLocation']) {
      let plannedEstimatedDatetime = anouncement['PlannedEstimatedTimeAtLocation'].split('T')
      plannedEstimatedDate = plannedEstimatedDatetime[0]
      plannedEstimatedTime = plannedEstimatedDatetime[1]
    }

    if (anouncement['ScheduledDepartureDateTime']) {
      let scheduledDepartureDatetime = anouncement['ScheduledDepartureDateTime'].split('T')
      scheduledDepartureDate = scheduledDepartureDatetime[0]
      scheduledDepartureTime = scheduledDepartureDatetime[1]
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
      _informationOwner: anouncement['InformationOwner'],
      train: anouncement['AdvertisedTrainIdent'],
      track: anouncement['TrackAtLocation'],
      canceled: anouncement['Canceled'],
      delayed: delayed,
      deviation: anouncement['Deviation'],
      date: date,
      time: time,
      estimatedDate: estimatedDate,
      estimatedTime: estimatedTime,
      plannedEstimatedDate: plannedEstimatedDate,
      plannedEstimatedTime: plannedEstimatedTime,
      scheduledDepartureDate: scheduledDepartureDate,
      scheduledDepartureTime: scheduledDepartureTime,
      destination: toLocation,
      via: viaLocations
    }
  }).filter(departure => departure._informationOwner === 'SJ')
}

const mainExport = {
  getDepartures: getDepartures
}

export default mainExport
module.exports = mainExport // for CommonJS compatibility
