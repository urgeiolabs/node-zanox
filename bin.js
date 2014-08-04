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
  .option('one', {
    help: 'Limit to one result',
    flag: true,
    abbr: '1',
    default: false
  })
  .parse();

zanox({keywords: opts.keywords})
  .id(opts.id)
  .program(opts.program)
  .price(opts.price)
  .one(opts.one)
  .done(function (err, res) {
    if (err) throw err;
    console.log(JSON.stringify(res));
  });
