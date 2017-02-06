# Trafikverket Wrapper

A wrapper for the [Trafikverket API](http://api.trafikinfo.trafikverket.se/API/) that provides information about trains in Sweden.

## Usage

```javascript
let trafikverket = require('trafikverket')
trafikverket.getDeparturesFrom('Flen')
```

## FAQ

* How do I set my API key?
** `export TRAFIKVERKET_API_KEY=<your API key>`