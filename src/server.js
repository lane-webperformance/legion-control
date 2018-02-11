'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const local_storage = require('./local-client');

module.exports.control = function(client) {
  client = client || local_storage.create();

  const app = express();

  app.patch('/control/counters', function(req,res) {
    client.getCounters(req.query.project_key,req.query.counter_key,parseFloat(req.query.n)).then(data => {
      res.setHeader('content-type', 'application/json');
      res.json({
        status : 'success',
        data : data
      });
    }).catch(err => {
      res.sendState(500);
      throw err;
    });
  });

  app.get('/control', function(req,res) {
    client.getControlData(req.query.project_key).then(data => {
      res.setHeader('content-type', 'application/json');
      res.json({
        status : 'success',
        data : (data || null)
      });
    }).catch(err => {
      res.sendStatus(500);
      throw err;
    });
  });

  app.put('/control', function(req,res) {
    res.setHeader('content-type', 'application/json');
    client.putControlData(req.query.project_key, validate(req.body)).then(() => {
      res.sendStatus(204);
    }).catch(err => {
      res.sendStatus(500);
      throw err;
    });
  });

  return app;
};

///////////////////////////////////////////////////////////////////////////////
// listen
///////////////////////////////////////////////////////////////////////////////

module.exports.withClient = function(client) {
  return {
    listen : function() {
      const app = express();

      app.use(bodyParser.json({}))
        .use(module.exports.control(client));

      return app.listen.apply(app, arguments);
    }
  };
};

module.exports.listen = module.exports.withClient(undefined).listen;

/*
 * Throws an error if there's any problem with the control data.
 */
function validate(json_control_data) {
  if( typeof json_control_data !== 'object' )
    return new Error('Not a JSON object, was: ' + typeof json_control_data);

  return json_control_data;
}
