
[![Build Status](https://travis-ci.org/lane-webperformance/legion-control.svg?branch=master)](https://travis-ci.org/lane-webperformance/legion-control)
[![Dependency Status](https://gemnasium.com/badges/github.com/lane-webperformance/legion-control.svg)](https://gemnasium.com/github.com/lane-webperformance/legion-control)

Command and control services for legion instances.

	var control = require('legion-control');

### control.create(options)

Create a client object to connect to a control service.

 * options - options for the client API
   * endpoint - URL of the remote service. If not specified, the client will create its own local instance.
   * interval - request rate limit in milliseconds (optional)

It's recommended that request rate limits be small, since the client may return stale data or even
hang (asynchronously) for the given interval. Rate limits may add together if multiple rate-limited clients
are daisy-chained.

control.clients
---------------

Client APIs to access command and control services.
There are at least three different implementations of the client API: a local client, a remote client,
and a rate-limited wrapper. All clients implement a common interface.

### getControlData(project\_key)

Get control data for the given key.

 * project\_key : string - key under which the control data will be stored.

Returns a Promise containing the control data.

### putControlData(project\_key, value)

Put control data for the given key.

 * project\_key : string - key under which the control data will be stored.
 * value : object - the control data

Returns a Promise containing undefined (or an exception).

### getCounters(project\_key, counter\_key, n)

Get a counter. A counter is a small number (or range of numbers) that will be
unique for any given project key.

 * project\_key : string - key under which the counter data will be stored.
 * counter\_key : string - key for the particular counter (multiple counters per project\_key)
 * n : number - number of counters needed

Returns a Promise containing an object indicating the range of the counters returned:

 * from : number - begin of range (inclusive)
 * to : number - end of range (exclusive)

For example, Client.getCounters('my-project', 'my-counter', 3) might return
{ from: 7, to: 10 }. This means that 7, 8, and 9 are all in the returned range.

### control.clients.local.create()

Create a client with its own local instance of the control service.

### control.clients.remote.create(endpoint)

Create a client to connect to a remote service.

 * endpoint : string - the URL of the remote service.

### control.clients.rate\_limited.create(client, interval)

Create a client that rate-limits requests to a control service.

 * child : Client - another client API instance
 * interval : number - request rate limit interval in milliseconds

control.server(client)
----------------------

Run a control server.

### control.server.listen(...)

Starts the capture server. Accepts the same parameters as .listen() on any express app.

### control.server.withClient(client).listen(...)

Starts the capture server, forwarding all requests to the specified client.
Accepts the same parameters as .listen() on any express app.






