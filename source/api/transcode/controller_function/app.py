import boto3
import os
import json
import math
import subprocess
from botocore.config import Config
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
dataset_table = dynamodb.Table('serverless-video-transcode-datasets')

PARALLEL_GROUPS = int(os.environ['PARALLEL_GROUPS'])
MAX_CONCURRENCY_MAP = 40

def analyze_video(bucket, key, video_file, options):

    if 'aws_region' in options:
        s3_client = boto3.client('s3', options['aws_region'], config=Config(
            s3={'addressing_style': 'path'}))
    else:
        s3_client = boto3.client('s3', os.environ['aws_region'], config=Config(
            s3={'addressing_style': 'path'}))

    video_file_presigned_url = s3_client.generate_presigned_url(
        ClientMethod='get_object',
        Params={'Bucket': bucket, 'Key': key},
        ExpiresIn=1200
    )

    # get media information.
    cmd = ['ffprobe', '-loglevel', 'error', '-show_format',
           '-show_streams', '-of', 'json', video_file_presigned_url]

    print("get media information")
    return json.loads(subprocess.check_output(cmd))


def generate_control_data(video_details, segment_time, object_name, s3_bucket, s3_prefix, options):
    control_data = {
        "video_details": video_details,
        "object_name": object_name,
        "video_groups": [],
        "s3_bucket": s3_bucket,
        "s3_prefix": s3_prefix,
        "options": options

    }

    video_stream = None
    for stream in video_details["streams"]:
        if stream["codec_type"] == "video":
            video_stream = stream
            break

    if video_stream != None:
        video_duration = float(video_stream["duration"])
        segment_count = int(math.ceil(video_duration / segment_time))
        print("video duration: {}, segment_time: {}, segment_count: {}".format(
            video_duration, segment_time, segment_count))

        video_groups = []
        group_count = PARALLEL_GROUPS
        group_segment_count = math.ceil(1.0*segment_count/group_count)

        for group_index in range(0, group_count):
            video_segments = []
            for segment_index in range(0, group_segment_count):
                if segment_count <= 0:
                    break
                video_segments.append({
                    "start_ts": segment_time * (group_index * group_segment_count + segment_index),
                    "duration": segment_time,
                    "segment_order": group_index * group_segment_count + segment_index
                })
                segment_count -= 1
            video_groups.append(video_segments)

        control_data["video_groups"] = video_groups

    return control_data


def lambda_handler(event, context):
    bucket = event['bucket']
    key = event['key']
    object_prefix = event['object_prefix']
    object_name = event['object_name']
    segment_time = int(event.get('segment_time', os.environ['DEFAULT_SEGMENT_TIME']))
    options = event['options']


    response = dataset_table.query(
        IndexName='s3_key-index',
        KeyConditionExpression=Key('s3_key').eq(key)
    )
    print(response)
    if len(response['Items']) > 0:
        item = response['Items'][0]
        item['status'] = 'Start analyzing the target video'
        dataset_table.put_item(Item=item)

    try:
        video_details = analyze_video(bucket, key, object_name, options)
    except Exception as exp:
        if len(response['Items']) > 0:
            item['status'] = 'Failed to analyze the target video, detail error:' + exp
            dataset_table.put_item(Item=item)
        raise

    print(video_details)

    if len(response['Items']) > 0:
        item['status'] = 'Start transcoding'
        item['duration'] = video_details.get('format').get('duration')
        item['size'] = video_details.get('format').get('size')
        dataset_table.put_item(Item=item)

    try:
        control_data = generate_control_data(video_details, segment_time, object_name, bucket, object_prefix, options)
    except Exception as exp:
        if len(response['Items']) > 0:
           item['status'] = 'Failed to generate control data in Controller Lambda function, detail error:' + exp
           dataset_table.put_item(Item=item)
        raise

    return control_data
