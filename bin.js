#!/usr/bin/env node

/**
 * Dependencies
 */
var zanox = require('./')
  , nomnom = require('nomnom');

var opts = nomnom
  .script('zanox')
  .option('id', {
    help: 'API id',
    required: true,
    abbr: 'i'
  })
  .option('keywords', {
    help: 'Keywords to search',
    required: true,
    abbr: 'k'
  })
  .option('program', {
    help: 'Program id',
    abbr: 'p'
  })
  .option('price', {
    help: 'Price range, .. separated',
    default: '',
    abbr: 'c'
  })
  .option('page', {
    help: 'Results page',
    abbr: 'g'
  })
  .option('one', {
    help: 'Limit to one result',
    flag: true,
    abbr: '1',
    default: false
  })
  .option('limit', {
    help: 'Limit number of results',
    abbr: 'l'
  })
  .parse();

zanox({keywords: opts.keywords})
  .id(opts.id)
  .program(opts.program)
  .price(opts.price)
  .page(opts.page)
  .one(opts.one)
  .limit(opts.limit)
  .done(function (err, res) {
    if (err) throw err;
    console.log(JSON.stringify(res));
  });
