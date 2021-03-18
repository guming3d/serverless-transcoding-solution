#!/usr/bin/env node

'use strict';

const program = require('commander');

program
    .version('1.0')
    .command('create-task [parameters]', 'creates a new serverless video transcode task')
    .command('describe-task [parameters]', 'describes the details of a task')
    .command('describe-task-dataset [parameters]', 'describes a dataset associated to a task')
    .command('describe-task-datasets [parameters]', 'describes the datasets associated with a task')
    .command('execute-task-transcode [parameters]', 'Execute transcode for the specified task.')
    .command('remove-task [parameters]', 'removes a task from the serverless video transcode')
    .command('remove-task-dataset [parameters]', 'removes a dataset from a task')
    .command('list-task [parameters]', 'list tasks in serverless video transcode')
    .command('update-task [parameters]', 'overwrites the details for a task')
    .command('upload-task-dataset [parameters]', 'uploads a new dataset file for a task');

program.parse(process.argv);