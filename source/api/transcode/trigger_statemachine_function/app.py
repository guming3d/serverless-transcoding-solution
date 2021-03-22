import boto3
import json
import os
import uuid

create_hls = os.environ['ENABLE_HLS']
segment_time = os.environ['DEFAULT_SEGMENT_TIME']
sfn_client = boto3.client('stepfunctions')

def lambda_handler(event, context):
    bucket = event['bucket']
    key = event['key']
    options = event['options']
    object_prefix = key[:key.rfind('/') + 1]
    object_name = key[key.rfind('/') + 1:]

    print(options)
    job_id = str(uuid.uuid4())

    # kick start the main statemachine for transcoding
    response = sfn_client.start_execution(
        stateMachineArn=os.environ['SFN_ARN'],
        input= json.dumps({
            'job_id': job_id,
            'bucket': bucket,
            'key': key,
            'object_prefix': object_prefix,
            'object_name': object_name,
            "segment_time": segment_time,
            'create_hls': create_hls,
            'options': options
        })
    )
