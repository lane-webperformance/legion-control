/* eslint-disable no-console */

'use strict';

const port = 8511;

require('./index').server.listen(port, function() {
  console.log('legion-control listening on port ' + port + '.');
});
