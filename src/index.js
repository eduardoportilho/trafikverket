import trainStation from './train-station.js'
import trainAnnouncement from './train-announcement.js'

const mainExport = {
  getTrainStationsInfo: trainStation.getTrainStationsInfo,
  getDepartures: trainAnnouncement.getDepartures
}

export default mainExport
module.exports = mainExport // for CommonJS compatibility
