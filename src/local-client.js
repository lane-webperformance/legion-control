'use strict';

const Client = {
  requests : 0
};

module.exports.prototype = Client;

module.exports.create = function() {
  return Object.assign(Object.create(Client), {
    _storage: {},
    _counter_storage: {}
  });
};

Client.getControlData = function(project_key) {
  this.requests++;
  return Promise.resolve(this._storage[project_key]);
};

Client.putControlData = function(project_key,value) {
  this.requests++;
  this._storage[project_key] = value;
  return Promise.resolve();
};

Client.getCounters = function(project_key,counter_key,n) {
  this.requests++;

  validateKey('project_key', project_key);
  validateKey('counter_key', counter_key);

  /* istanbul ignore next */
  if( typeof n !== 'number' || !Number.isFinite(n) || n <= 0 )
    throw new Error('getCounters: parameter "n" must be a positive number');

  this._counter_storage[project_key] = this._counter_storage[project_key] || {};
  this._counter_storage[project_key][counter_key] = this._counter_storage[project_key][counter_key] || {};
  const counter = this._counter_storage[project_key][counter_key];

  counter.last = counter.last || 0;

  const result = {
    from: counter.last,
    to: counter.last + n
  };

  counter.last += n;

  return Promise.resolve(result);
};

function validateKey(key_name, key) {
  /* istanbul ignore next */
  if( typeof key !== 'string' )
    throw new Error('"' + key_name + '" must be a number');
}


