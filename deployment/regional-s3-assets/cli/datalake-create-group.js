'use strict';

let program = require('commander');
let Creds = require('./core/credentials.js');
let ApiProxy = require('./core/apiproxy.js');

//-----------------------------------------------------------------------------
// validate input
//-----------------------------------------------------------------------------
program
    .option('--name <value>', 'The name of the group. Must be unique and satisfy regular expression pattern [\p{L}\p{M}\p{S}\p{N}\p{P}]+')
    .option('--description <value>', 'A string containing the description of the group')
    .parse(process.argv);

if (!program.name) {
    console.error('option "--name <value>" argument required');
    process.exit(1);
}

//-----------------------------------------------------------------------------
// get the signed api credentials
//-----------------------------------------------------------------------------
let _creds = new Creds();
let _authKey = _creds.getAuthSignature();

//-----------------------------------------------------------------------------
// send api request
//-----------------------------------------------------------------------------
let _apiproxy = new ApiProxy();
let _path = `/prod/admin/groups/${encodeURI(program.name)}/`;
let _payload = JSON.stringify({
    description: program.description ? program.description : ""
});

//-----------------------------------------------------------------------------
// print result
//-----------------------------------------------------------------------------
_apiproxy.sendApiRequest(_path, 'PUT', _payload, _authKey, function(err, data) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    console.log(JSON.stringify(data));
});
