/**
 * Module dependencies
 */
var request = require('superagent')
  , _ = require('underscore');

var endpoint = 'https://api.zanox.com/json/2011-03-01/products';

module.exports = function (opts) {
  return new Zanox(opts);
};

var Zanox = function Zanox (opts) {
  this._keywords = opts;

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
    .query({items: this._numItems})
    .query({programs: this._programs && this._programs.join(',')})
    .end(function (err, res) {
      if (err) return cb(err);
      return cb(err, res.body);
    });
};
