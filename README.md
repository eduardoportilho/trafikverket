# Trafikverket Wrapper

A wrapper for the [Trafikverket API](http://api.trafikinfo.trafikverket.se/API/) that provides information about trains in Sweden.

## Usage

```javascript
let trafikverket = require('trafikverket')
trafikverket.getDeparturesFrom('Flen')
```

## FAQ

* How do I set my API key in my host?
** `export TRAFIKVERKET_API_KEY=<your API key>`
* How do I test the api?
```
$ env TRAFIKVERKET_API_KEY=<your API key> NODE_ENV=production node
> let trafik = require('./index')
> trafik.getDeparturesFrom('Fle').then((obj) => console.log(JSON.stringify(obj)))
```