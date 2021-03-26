'use strict';

let program = require('commander');
let Token = require('./core/token.js');
let ApiProxy = require('./core/apiproxy.js');

program
    .option('--task-name <value>', 'Name of the task')
    .option('--task-description <value>', 'Description of the task')
    .option('--metadata <value>', 'List of metadata to assign to the task')
    .parse(process.argv);

if (!program.taskName) {
    console.error('option "--task-name <value>" argument required');
    process.exit(1);
}

if (!program.taskDescription) {
    console.error('option "--task-description <value>" argument required');
    process.exit(1);
}

let _payload = {
    package: {
        name: program.taskName,
        description: program.taskDescription
    }
};

if (program.metadata) {
    _payload.metadata = JSON.parse(program.metadata);
}


// send api request
let _apiproxy = new ApiProxy();
_apiproxy.sendApiRequest('/prod/tasks/new', 'POST', JSON.stringify(_payload), Token, function(err, data) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    console.log(JSON.stringify(data, null, 4));
});
