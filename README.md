# Trafikverket Wrapper

A wrapper for the [Trafikverket API](http://api.trafikinfo.trafikverket.se/API/) that provides information about trains in Sweden.

## Usage

```javascript
let trafikverket = require('trafikverket')
trafikverket.getDepartures('Flen')
```

## FAQ

* How do I set my API key in my host?

```
export TRAFIKVERKET_API_KEY=<your API key>
```

* How do I test the api?

```
$ env TRAFIKVERKET_API_KEY=<your API key> NODE_ENV=production node
> let trafik = require('./index')
> trafik.getDepartures('Fle').then((obj) => console.log(JSON.stringify(obj)))
```

## To do:

- [x] `trafik.getDepartures('Cst', 'Fle')` (When 'Fle' is not the final destination)
- [ ] Create service to return station info (sync?)
- [ ] Parametrize the time interval