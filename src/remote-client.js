'use strict';

const fetch = require('node-fetch');
const querystring = require('querystring');

const Client = {
  requests : 0
};

module.exports.prototype = Client;

module.exports.create = function(endpoint) {
  return Object.assign(Object.create(Client), {
    _endpoint: endpoint
  });
};

Client.putControlData = function(project_key, data) {
  this.requests++;

  /* istanbul ignore if */
  if( typeof project_key !== 'string' )
    throw new Error('invalid project_key: ' + project_key);

  /* istanbul ignore if */
  if( typeof data !== 'object' )
    throw new Error('invalid control data: ' + data);

  return fetch(this._endpoint + '/control?' + querystring.stringify({ project_key: project_key }), {
    method: 'PUT',
    headers : { 'content-type': 'application/json' },
    body : JSON.stringify(data)
  }).then(res => res.text().then(empty => this.validate204Response(res,empty,'PUT /control')));
};

Client.getControlData = function(project_key) {
  this.requests++;

  const url = this._endpoint + '/control?' + querystring.stringify({ project_key: project_key });
  return fetch(url).then(res => res.text().then(text => this.validate200Response(res,text,'GET ' + url).data));
};

Client.getCounters = function(project_key,counter_key,n) {
  this.requests++;

  const url = this._endpoint + '/control/counters?' + querystring.stringify({ project_key: project_key, counter_key: counter_key, n: n });
  return fetch(url, {
    method: 'PATCH'
  }).then(res => res.text().then(text => this.validate200Response(res,text,'PATCH ' + url).data));
};


// Examines a response object with text content and produces a suitable user-friendly error message if there is a problem.
//
// res: a Response object
// text: (string) the text content of the response, which will be JSON or result in a parse error
// what: a short human-readable string describing what we did to get the response
//
// returns: the JSON.parse of the content
Client.validate200Response = function(res, text, what) {
  let json = undefined;
  try {
    json = JSON.parse(text);
  } catch(err) {
    throw new Error('Unexpected response to: ' + what + ' (' + res.status + ' ' + res.statusText + '): ' + text);
  }

  return json;
};

// Examines a response object with text content and produces a suitable user-friendly error message if there is a problem.
//
// res: a Response object
// text: (string) the text content of the response
// what: a short human-readable string describing what we did to get the response
//
// returns: nothing
Client.validate204Response = function(res, text, what) {
  if( !res.ok || res.status !== 204 || text !== '' )
    throw new Error('Undexpected response to ' + what + ' (' + res.status + ' ' + res.statusText + '): ' + text);

  return undefined;
};
