#!/usr/bin/env node

'use strict';

const program = require('commander');

program
    .version('%%VERSION%%')
    .command('create-task [parameters]', 'creates a new serverless video transcode task')
    .command('describe-task [parameters]', 'describes the details of a task')
    .command('describe-task-dataset [parameters]', 'describes a dataset associated to a task')
    .command('describe-task-datasets [parameters]', 'describes the datasets associated with a task')
    .command('execute-task-crawler [parameters]', 'Starts a crawler for the specified task, regardless of what is scheduled. If the crawler is already running, the request is ignored.')
    .command('get-task-crawler [parameters]', 'Retrieves crawler metadata for a specified task.')
    .command('get-task-table-data [parameters]', 'Retrieves the external link to view table data in Amazon Athena.')
    .command('remove-task [parameters]', 'removes a task from the serverless video transcode')
    .command('remove-task-dataset [parameters]', 'removes a dataset from a task')
    .command('search [parameters]', 'search serverless video transcode')
    .command('update-task [parameters]', 'overwrites the details for a task')
    .command('update-task-crawler [parameters]', 'Update the task crawler. If the task does not have one, a new crawler is created.')
    .command('update-user-group-list [parameters]', 'Updates the list of groups that the user belongs to.')
    .command('upload-task-dataset [parameters]', 'uploads a new dataset file for a task');

program.parse(process.argv);