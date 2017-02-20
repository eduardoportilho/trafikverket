import trainAnnouncement from './train-announcement.js'

const mainExport = {
  getDepartures: trainAnnouncement.getDepartures
}

export default mainExport
module.exports = mainExport // for CommonJS compatibility
