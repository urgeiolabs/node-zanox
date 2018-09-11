const axios = require('axios')
const _ = require('underscore')

const endpoint = 'https://api.zanox.com/json/2011-03-01/products'

class Zanox {
  constructor (opts) {
    if (typeof opts === 'string') {
      this._keywords = opts
      return
    }

    const {
      id, keywords, country, category, programs,
      price, page, exactMatch, searchType, limit, ean
    } = opts

    this._partership = 'confirmed'
    this._searchType = searchType || 'phrase'

    if (id) this._id = id
    if (keywords) this._keywords = keywords
    if (country) this._country = country
    if (category) this._category = category
    if (programs) {
      this._programs = programs.split(',')
    }
    if (price) {
      if (typeof price === 'string') price = price.split('..')

      if (price[0]) this._minPrice = price[0]
      if (price[1]) this._maxPrice = price[1]
    }
    if (page) this._page = page
    if (exactMatch) this._exactMatch = exactMatch
    if (limit) this._limit = limit
    if (ean) this._ean = ean
  }

  id (id) {
    this._id = id
    return this
  }

  keywords (keywords) {
    this._keywords = keywords
    return this
  }

  country (country) {
    this._country = country
    return this
  }

  category (category) {
    this._category = category
    return this
  }

  program (program) {
    if (!this._programs) this._programs = []
    this._programs.push(program)
    return this
  }

  price (price) {
    if (typeof price === 'string') price = price.split('..')

    if (price[0]) this._minPrice = price[0]
    if (price[1]) this._maxPrice = price[1]
    return this
  }

  page (page) {
    this._page = page
    return this
  }

  one (one) {
    this._one = one
    return this
  }

  exactMatch (exactMatch) {
    this._exactMatch = exactMatch
    return this
  }

  searchType (searchType) {
    if (!searchType) {
      this._searchType = 'phrase'
    } else if (searchType !== 'contextual' && searchType !== 'phrase') {
      throw new Error('Invalid search type')
    }
    return this
  }

  limit (limit) {
    this._limit = limit
    return this
  }

  ean (ean) {
    this._ean = ean
    return this
  }

  makeRequest () {
    return new Promise((resolve, reject) => {
      const query = { partnership: this._partnership }

      if (this._keywords) query.q = this._keywords
      if (this._ean) query.ean = this._ean
      if (this._id) query.connectid = this._id
      if (this._searchType) query.searchtype = this._searchType
      if (this._country) query.region = this._country
      if (this._category) query.merchantcategory = this._category
      if (this._minPrice) query.minprice = this._minPrice
      if (this._maxPrice) query.maxprice = this._maxPrice
      if (this._programs) query.programs = this._programs.join(',')
      if (this._page) query.page = this._page

      axios.get(endpoint, { params: query })
      .then(({ data }) => {
        if (data.message) return reject(new Error(data.message))

        let products = data.productItems
          && data.productItems.productItem
          || []

        products = format(products)

        if (this._one) {
          if (this._exactMatch && this._keywords) {
            let exactMatch
            const eachWord = this._keywords.split(' ')
            let match = false

            // Check every product we got
            products.some(p => {
              match = true
              // Check if each keyword is in the product name
              eachWord.forEach(word => {
                if (!p.name) {
                  match = false
                  return
                }
                if (typeof p.name === 'string' && !p.name.includes(word)) {
                  match = false
                }
              })

              // Found a product with all keywods
              if (match) {
                exactMatch = p
                return true
              }
            })
            products = exactMatch || null
          } else {
            products = _.first(products) || null
          }
        } else if (this._limit) {
          products = _.first(products, this._limit)
        }

        return resolve(products)
      })
      .catch(reject)
    })
  }

  done (cb) {
    if (cb) {
      return this.makeRequest()
        .then(products => cb(null, products))
        .catch(cb)
    }

    return new Promise((resolve, reject) => {
      return this.makeRequest()
        .then(products => resolve(products))
        .catch(reject)
    })
  }
}

function format (products) {
  return products.map(p => {
    const price = p.price
    const name = p.name
    const link = links(p.trackingLinks)

    if (!price || !name || !link) return null

    const product = {
      name,
      id: p['@id'],
      listPrice: price,
      currency: p.currency,
      url: link
    }

    if (p.ean) product.ean = p.ean

    return product
  }).filter(p => p)
}

function links (links) {
  if (!links) return null
  return links.trackingLink[0].ppc || null
}

module.exports = function (opts) {
  return new Zanox(opts);
}
