'use strict';

let program = require('commander');
let Token = require('./core/token.js');
let ApiProxy = require('./core/apiproxy.js');

program
    .option('--terms <value>', 'search terms')
    .parse(process.argv);

if (!program.terms) {
    console.error('option "--terms <value>" argument required');
    process.exit(1);
}


let _terms = program.terms.replace(/ /g, '+')

// send api request
let _apiproxy = new ApiProxy();
let _path = ['/prod/search?term', _terms].join('=');
_apiproxy.sendApiRequest(_path, 'GET', null, Token, function(err, data) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    console.log(JSON.stringify(data));
});
