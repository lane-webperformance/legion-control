'use strict';

const control = require('../src');

describe('The control client-server mechanism', function() {
  beforeEach(function() {
    this.server_client = control.clients.local.create();
    this.port = 4132;
    this.server = control.server.withClient(this.server_client).listen(this.port);
    this.endpoint = 'http://localhost:' + this.port;

    this.clients = {};
    this.clients.default = control.create({ endpoint: this.endpoint, interval: 1000 });
    this.clients.remote = control.clients.remote.create(this.endpoint);
    this.clients.rate_limited = control.clients.rate_limited.create(control.clients.remote.create(this.endpoint), 1000);
    this.clients.local = control.clients.local.create();
  });

  afterEach(function() {
    this.server.close();
  });

  it('reports null control data for projects that haven\'t yet been populated', function(done) {
    const client = this.clients.remote;

    client.getControlData('example-project').then(null_value => {
      expect(null_value).toBeNull();
    }).then(done).catch(done.fail);
  });

  it('accepts control data which can later be retrieved', function(done) {
    const client = this.clients.remote;

    client.putControlData('example-project', { control : { users : 50 } })
      .then(() => client.getControlData('example-project'))
      .then(data => {
        expect(data.control.users).toBe(50);
      }).then(done).catch(done.fail);
  });

  it('supports rate-limited client-server connections', function(done) {
    const client = this.clients.rate_limited;
    const results = [];

    client.putControlData('example-project', { control : { users : 50 } }).then(() => {
      for( let i = 0; i < 10000; i++ )
        results.push(client.getControlData('example-project'));

      return Promise.all(results);
    }).then(results => {
      expect(results[5000]).toEqual({ control : { users : 50 } });
      expect(results[0]).toBe(results[9999]);
      expect(this.server_client.requests).toBe(2 /* one for putControlData + one for getControlData */);
    }).then(done).catch(done.fail);
  });

  it('allows pulling unique numeric counters', function(done) {
    const client = this.clients.remote;

    client.getCounters('example-project','foo',1).then(range => {
      expect(range.from).toEqual(0);
      expect(range.to).toEqual(1);
    }).then(done).catch(done.fail);
  });

  it('ensures unique counters are unique', function(done) {
    const client = this.clients.remote;

    const g1 = client.getCounters('example-project','foo',1);
    const g2 = client.getCounters('example-project','foo',5);
    const g3 = client.getCounters('example-project','foo',3);

    Promise.all([g1,g2,g3]).then(results => {
      expect(results[0].to).not.toEqual(results[1].to);
      expect(results[0].to).not.toEqual(results[2].to);
      expect(results[1].to).not.toEqual(results[2].to);
      expect(results[0].from).not.toEqual(results[1].from);
      expect(results[0].from).not.toEqual(results[2].from);
      expect(results[1].from).not.toEqual(results[2].from);

      /* istanbul ignore next */
      expect(results[0].to === results[1].from || results[0].to === results[2].from || results[1].to === results[0].from || results[1].to === results[2].from).toBe(true);
    }).then(done).catch(done.fail);
  });

  it('rate-limits requests for unique numeric counters', function(done) {
    const client = this.clients.rate_limited;
    const results = [];

    for( let i = 0; i < 1000; i++ )
      results.push(client.getCounters('example-project','foo',1));

    Promise.all(results).then(counters => {
      const is = [];
      for( let i = 0; i < 1000; i++ )
        is[i] = false;
      for( let i = 0; i < 1000; i++ )
        is[counters[i].from] = true;
      for( let i = 0; i < 1000; i++ )
        expect(is[i]).toBe(true);
      expect(this.server_client.requests).toBe(1);
    }).then(done).catch(done.fail);
  });
});
