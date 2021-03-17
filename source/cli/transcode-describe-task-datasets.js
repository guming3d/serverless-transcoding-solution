'use strict';

let program = require('commander');
let Token = require('./core/token.js');
let ApiProxy = require('./core/apiproxy.js');

program
    .option('--package-id <value>', 'package identifier')
    .parse(process.argv);

if (!program.packageId) {
    console.error('option "--package-id <value>" argument required');
    process.exit(1);
}


// send api request
let _apiproxy = new ApiProxy();
let _path = ['/prod/packages/', program.packageId, '/datasets'].join('');
_apiproxy.sendApiRequest(_path, 'GET', null, Token, function(err, data) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    console.log(JSON.stringify(data, null, 4));
});
