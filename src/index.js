'use strict';

module.exports.server = require('./server');
module.exports.clients = {};
module.exports.clients.remote = require('./remote-client');
module.exports.clients.local = require('./local-client');
module.exports.clients.rate_limited  = require('./rate-limited-client');

module.exports.create = function(options) {
  let client = module.exports.clients.local.create();

  if( options.endpoint )
    client = module.exports.clients.remote.create(options.endpoint);

  if( options.interval > 0 )
    client = module.exports.clients.rate_limited.create(client, options.interval);

  return client;
};
