'use strict';

let program = require('commander');
let Token = require('./core/token.js');
let ApiProxy = require('./core/apiproxy.js');

program
    .option('--task-name <value>', 'Name of the package')
    .option('--task-description <value>', 'Description of the package')
    .option('--metadata <value>', 'List of metadata to assign to the package')
    .parse(process.argv);

if (!program.packageName) {
    console.error('option "--task-name <value>" argument required');
    process.exit(1);
}

if (!program.packageDescription) {
    console.error('option "--task-description <value>" argument required');
    process.exit(1);
}

let _payload = {
    package: {
        name: program.packageName,
        description: program.packageDescription
    }
};

if (program.metadata) {
    _payload.metadata = JSON.parse(program.metadata);
}


// send api request
let _apiproxy = new ApiProxy();
_apiproxy.sendApiRequest('/prod/packages/new', 'POST', JSON.stringify(_payload), Token, function(err, data) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    console.log(JSON.stringify(data, null, 4));
});
