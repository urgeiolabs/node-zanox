# node-zanox-lookup

## Introduction

This module is a simple wrapper around the zanox product search API. See [the documentation](https://developer.zanox.com/publisher-api-2011/get-products) for more information

## Installation

    npm install zanox-lookup

## Usage

Full example

```javascript
const zanox = require('zanox-lookup');

zanox({ keywords: 'test'} )
  .id('<zanox api key>')
  .country('DE')
  .program('33223')
  .price('10..100')
  .searchType('phrase')
  .done(function (err, results) {})
```

### New in version 1.0

- All settings can be added in the constructor
- `.done()` is a promise by default but can also return a callback like before
- Instead of using keywords the EAN can be passed into the request

Example

```javascript
const zanox = require('zanox-lookup');

zanox({ id: '<zanox api key>', programs: '1234,9876', ean: '98264839' })
  .program('19283') // add another SINGLE program for whatever reason
  .one(true) // returns one product/object instead of an array of products
  .done()
  .then(res => console.log(res))
  .catch(err => { throw err })
```

## License

MIT
