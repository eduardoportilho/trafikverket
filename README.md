# Trafikverket Wrapper

[![travis build](https://img.shields.io/travis/eduardoportilho/trafikverket.svg?style=flat)](https://travis-ci.org/eduardoportilho/trafikverket)
[![codecov coverage](https://img.shields.io/codecov/c/github/eduardoportilho/trafikverket.svg?style=flat)](https://codecov.io/github/eduardoportilho/trafikverket)
[![version](https://img.shields.io/npm/v/trafikverket.svg?style=flat)](http://npm.im/trafikverket)
[![MIT License](https://img.shields.io/npm/l/trafikverket.svg?style=flat)](http://opensource.org/licenses/MIT)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat)](https://github.com/semantic-release/semantic-release)

A wrapper for the [Trafikverket API](http://api.trafikinfo.trafikverket.se/API/) that provides information about trains in Sweden.

## Usage

```javascript
let trafikverket = require('trafikverket')
trafikverket.getDepartures('Cst', 'Flen')
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

## Roadmap:

- [x] `trafik.getDepartures('Cst', 'Fle')` (When 'Fle' is not the final destination)
- [x] Create service to return station info (sync?)
- [ ] Parametrize the time interval
- [ ] Filter anouncements without data