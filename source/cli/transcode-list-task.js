'use strict';

let program = require('commander');
let Token = require('./core/token.js');
let ApiProxy = require('./core/apiproxy.js');

let _terms = '*'

// send api request
let _apiproxy = new ApiProxy();
let _path = ['/prod/search?term', _terms].join('=');
_apiproxy.sendApiRequest(_path, 'GET', null, Token, function(err, data) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    console.log(JSON.stringify(data, null, 4));

});
