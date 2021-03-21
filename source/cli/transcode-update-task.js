'use strict';

let program = require('commander');
let Token = require('./core/token.js');
let ApiProxy = require('./core/apiproxy.js');

program
    .option('--task-id <value>', 'task identifier')
    .option('--task-name <value>', 'Updated package name')
    .option('--task-description <value>', 'Updated package description')
    .parse(process.argv);

if (!program.taskId) {
    console.error('option "--task-id <value>" argument required');
    process.exit(1);
}

let _payload = {};

if (program.taskName) {
    _payload.name = program.taskName;
}

if (program.packageDescription) {
    _payload.description = program.packageDescription;
}


// send api request
let _apiproxy = new ApiProxy();
let _path = ['/prod/packages/', program.taskId].join('');
_apiproxy.sendApiRequest(_path, 'PUT', JSON.stringify(_payload), Token, function(err, data) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    console.log(JSON.stringify(data, null, 4));
});
