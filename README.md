# node-zanox-lookup

## Introduction

This module is a simple wrapper around the zanox product search API. See [the documentation](https://developer.zanox.com/publisher-api-2011/get-products) for more information 

## Installation

    npm install zanox-lookup

## Usage

Full example

```javascript
var zanox = require('zanox-lookup');

zanox({keywords: 'test'})
  .id('<zanox api key>')
  .country('DE')
  .program('33223')
  .price('10..100')
  .searchType('phrase')
  .done(function (err, results) {})
```

## License

MIT
