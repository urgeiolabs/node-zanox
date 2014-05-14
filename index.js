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
    _partnership: 'all'
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
  if (!this._categories) this._categories = [];

  return this._categories.push(category), this;
};

Zanox.prototype.program = function (program) {
  if (!this._programs) this._programs = [];

  return this._programs.push(program), this;
};

Zanox.prototype.minPrice = function (min) {
  return this._minPrice = min, this;
};

Zanox.prototype.maxPrice = function (max) {
  return this._maxPrice = max, this;
};

Zanox.prototype.price = function (price) {
  if (_.isArray(price)) {
    this._minPrice = price[0], this._maxPrice = price[1];
  } else if (_.isString(price)) {
    var split = price.split('..');

    if (split[0]) this._minPrice = split[0];
    if (split[1]) this._maxPrice = split[1];
  }

  return this;
};

Zanox.prototype.ean = function (ean) {
  return this._ean = ean, this;
};

Zanox.prototype.numItems = function (n) {
  return this._numItems = n, this;
};

Zanox.prototype.partnership = function (p) {
  return this._partnership = p, this;
};

Zanox.prototype.searchType = function (t) {
  return this._searchType = t, this;
};

Zanox.prototype.done = function (cb) {
  request
    .get(endpoint)
    .query({searchtype: this._searchType})
    .query({connectid: this._id})
    .query({q: this._keywords})
    .query({region: this._country})
    .query({merchantcategory: this._categories})
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
      return cb(null, parseResults(res.body, extractions));
    });
};

var formatPrice = function (p) {
  var amount = p.price
    , code = p.currency;

  if (!amount || !code) return null;
  return accounting.formatMoney(amount, currency(code));
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
