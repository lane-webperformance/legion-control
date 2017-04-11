'use strict';

const delay = require('promise-delay');

const Client = {
  requests : 0
};

module.exports.prototype = Client;

module.exports.create = function(child, rate_limit) {
  return Object.assign(Object.create(Client), {
    _cache: {},
    _timeout: {},
    _counter_cache: {},
    _child: child,
    _rate_limit: rate_limit
  });
};

Client.getControlData = function(project_key) {
  this.requests++;

  if( (this._timeout[project_key] || 0) < Date.now() ) {
    this._cache[project_key] = this._child.getControlData(project_key, this._cache[project_key]);
    this._timeout[project_key] = Date.now() + this._rate_limit;
  }

  return Promise.resolve(this._cache[project_key]);
};

Client.putControlData = function(project_key, data) {
  this.requests++;

  delete this._timeout[project_key];
  delete this._cache[project_key];

  return Promise.resolve(this._child.putControlData(project_key, data));
};

// Lookup a counter in the counter_cache, and it isn't present, initialize it.
function lookupCounter(client, project_key,counter_key) {
  client._counter_cache[project_key] = client._counter_cache[project_key] || {};
  client._counter_cache[project_key][counter_key] = client._counter_cache[project_key][counter_key] || {
    have : {
      from : 0,
      to : 0
    },
    need : 0,
    promise : null
  };

  return client._counter_cache[project_key][counter_key];
}

// Forward outstanding requests for counters to the child client.
function requestCounters(client, project_key,counter_key) {
  const counter = lookupCounter(client, project_key,counter_key);

  if( !(counter.need > 0) )
    return Promise.resolve();

  if( counter.promise )
    return counter.promise;

  counter.promise = delay(client._rate_limit)
    .then(() => {
      const need = counter.need;
      counter.need = 0;
      return client._child.getCounters(project_key,counter_key,need);
    }).then(result => {
      counter.promise = null;
      counter.have = result;
    }).catch(ex => {
      counter.promise = null;
      throw ex;
    });

  return counter.promise;
}

Client.getCounters = function(project_key,counter_key,n) {
  this._requests++;

  const counter = lookupCounter(this, project_key,counter_key,n);

  const result = {
    from : counter.have.from,
    to : counter.have.from + n
  };

  if( result.from >= counter.have.from && result.to <= counter.have.to ) {
    counter.have.from = result.to;
    return Promise.resolve(result);
  } else {
    counter.need += n;
    return requestCounters(this, project_key,counter_key)
      .then(() => this.getCounters(project_key,counter_key,n));
  }
};

