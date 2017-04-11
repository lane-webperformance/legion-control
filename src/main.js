/* eslint-disable no-console */

'use strict';

const port = 8001;

require('./index').server.listen(port, function() {
  console.log('legion-control listening on port ' + port + '.');
});
