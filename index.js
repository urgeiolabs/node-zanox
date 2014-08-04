/**
 * Module dependencies
 */
var request = require('superagent')
  , path = require('JSONPath').eval
  , accounting = require('accounting')
  , currency = require('currency-symbol-map')
  , _ = require('underscore');

var endpoint = 'https://api.zanox.com/json/2011-03-01/products';

module.exports = function (opts) {
  return new Zanox(opts);
};

var Zanox = function Zanox (opts) {
  if ('object' === typeof opts) {
    this._keywords = opts.keywords;
  } else {
    this._keywords = opts;
  }

  // Setup defaults
  _.defaults(this, {
    _partnership: 'confirmed'
  });
};

Zanox.prototype.id = function (id) {
  return this._id = id, this;
};

Zanox.prototype.keywords = function (kw) {
  return this._keywords = kw, this;
};

Zanox.prototype.country = function (country) {
  return this._country = country, this;
};

Zanox.prototype.category = function (category) {
  return this._category = category, this;
};

Zanox.prototype.program = function (program) {
  if (!this._programs) this._programs = [];

  return this._programs.push(program), this;
};

Zanox.prototype.price = function (price) {
  price = ('string' === typeof price) ? price.split('..') : price;

  if (price[0]) this._minPrice = price[0];
  if (price[1]) this._maxPrice = price[1];

  return this;
};

Zanox.prototype.one = function (one) {
  one = ('undefined' === typeof one) ? true : !!one;
  return this._one = one, this;
};

Zanox.prototype.searchType = function (t) {
  if ('contextual' !== t && 'phrase' !== t) throw new Error('Invalid search type');
  return this._searchType = t, this;
};

Zanox.prototype.limit = function (limit) {
  if (!limit) return this;
  return this._limit = limit, this;
};


Zanox.prototype.done = function (cb) {
  var that = this;

  var r = request
    .get(endpoint)
    .query({searchtype: this._searchType})
    .query({connectid: this._id})
    .query({q: this._keywords})
    .query({region: this._country})
    .query({merchantcategory: this._category})
    .query({partnership: this._partnership})
    .query({minprice: this._minPrice})
    .query({maxprice: this._maxPrice})
    .query({ean: this._ean})
    .query({items: 1})
    .query({programs: this._programs && this._programs.join(',')})
    .end(function (err, res) {
      // Handle connection errors
      if (err) return cb(err);

      // Handle client errors
      if (res.body.message) return cb(new Error(res.body.message));

      // Callback
      return cb(null, parseResults.call(that, res.body, extractions));
    });
};

var formatPrice = function (p) {
  var amount = p.price
    , code = p.currency
    , decimal, thousand;

  if (!amount || !code) return null;

  if (~['DE'].indexOf(this._country)) {
    decimal = ','; thousand = '.';
  } else {
    decimal = '.'; thousand = ',';
  }

  return accounting.formatMoney(amount, currency(code), null, thousand, decimal);
};

var extractions = [
  { name: 'id', query: '$..@id' },
  { name: 'name', query: '$..name' },
  { name: 'url', query: '$..trackingLink..ppc' },
  { name: 'listPrice',
    query: '$..productItem[0]',
    transform: formatPrice
  }
];

var first = function (obj, query) {
  var res = path(obj, query);
  return res.length ? res[0] : null;
};

var parseResults = function (obj, extractions) {
  var that = this;

  var res = _
    .chain(extractions)
    .map(function (x) {
      var key = x.name
        , val = first(obj, x.query);

      // Transform value if we have a transform available
      if (x.transform && val !== null) val = x.transform.call(that, val);

      return [key, val];
    })
    .filter(function (x) {
      return x[1] !== null;
    })
    .object()
    .value();

  return _.keys(res).length ? res : null;
};
