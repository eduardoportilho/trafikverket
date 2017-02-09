let production = {
  apiKey: process.env.TRAFIKVERKET_API_KEY,
  url: 'http://api.trafikinfo.trafikverket.se/v1.1/data.json'
}

let test = {
  apiKey: 'trafikverketApiKey',
  url: 'trafikverketApiUrl'
}

var isProduction = process.env.NODE_ENV === 'production'
module.exports = isProduction ? production : test
