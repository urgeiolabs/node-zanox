/**
 * Module dependencies
 */
var request = require('superagent')
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

Zanox.prototype.page = function (page) {
  if ('undefined' === typeof page) return this;
  return this._page = page, this;
};

Zanox.prototype.one = function (one) {
  one = ('undefined' === typeof one) ? true : !!one;
  return this._one = one, this;
};

Zanox.prototype.exactMatch = function (exactMatch) {
  if (!exactMatch) return this;
  return this._exactMatch = exactMatch, this;
  //exactMatch = ('undefined' === typeof exactMatch) ? true : !!exactMatch;
  //return this._exactMatch = exactMatch, this;
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
  return request
    .get(endpoint)
    .query({searchtype: this._searchType})
    .query({connectid: this._id})
    .query({q: this._keywords})
    .query({region: this._country})
    .query({merchantcategory: this._category})
    .query({partnership: this._partnership})
    .query({minprice: this._minPrice})
    .query({maxprice: this._maxPrice})
    .query({programs: this._programs && this._programs.join(',')})
    .query({page: this._page})
    .end(function (err, res) {
      // Handle connection errors
      if (err) return cb(err);

      // Grab body
      var body = res.body;

      // Handle client errors
      if (body.message) return cb(new Error(res.body.message));

      // Extract products
      var products = body.productItems && body.productItems.productItem;
      if (!products) products = [];

      // Format results
      products = format(products);

      // Limit results
      if (this._one) {
        if (this._exactMatch) {
          var a;
          var qw = this._keywords.split(' ');
          var matches = false;
          products.some(function(p) {
            matches = true;
            qw.forEach(function(w) {
              if (!p.name || typeof p.name === 'string' && p.name.indexOf(w) === -1)
                matches = false;
            });
            if (matches) {
              a = p;
              return true;
            }
          });
          products = a || null;
        } else {
          products = _.first(products) || null;
        }
      } else if (this._limit) {
        products = _.first(products, this._limit);
      }

      // Callback
      return cb(null, products);
    }.bind(this));
};

var format = function (products) {
  return products.map(function (p) {
    var price = p.price
      , name = p.name
      , link = links(p.trackingLinks);

    if (!price || !name || !link) return null;

    return {
      name: name,
      id: p['@id'],
      listPrice: price,
      currency: p.currency,
      url: link
    }
  }).filter(function (p) {
    return p;
  });
};

var links = function (links) {
  if (!links) return null;
  return links.trackingLink[0].ppc || null;
};
