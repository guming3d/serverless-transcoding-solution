'use strict';

let program = require('commander');
let Token = require('./core/token.js');
let ApiProxy = require('./core/apiproxy.js');

program
    .option('--task-name <value>', 'Name of the task')
    .option('--task-description <value>', 'Description of the task')
    .option('--metadata <value>', 'List of metadata to assign to the task')
    .option('--task-resolution <value>', 'resolution, example:360/720/1080/2160/ORIGINAL')
    .option('--task-bitrate <value>', 'bitrate of target video, example 500k/1000k/2000k/ORIGINAL')
    .option('--task-codec <value>', 'codec of target video, example h264/h265/ORIGINAL')
    .parse(process.argv);

if (!program.taskName) {
    console.error('option "--task-name <value>" argument required');
    process.exit(1);
}

if (!program.taskDescription) {
    console.error('option "--task-description <value>" argument required');
    process.exit(1);
}

if (!program.taskResolution) {
    console.error('option "--task-resolution <value>" argument required');
    process.exit(1);
}

if (!program.taskBitrate) {
    console.error('option "--task-bitrate <value>" argument required');
    process.exit(1);
}

if (!program.taskCodec) {
    console.error('option "--task-codec <value>" argument required');
    process.exit(1);
}

let _payload = {
    package: {
        name: program.taskName,
        description: program.taskDescription,
        resolution: program.taskResolution,
        bitrate: program.taskBitrate,
        codec: program.taskCodec
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
