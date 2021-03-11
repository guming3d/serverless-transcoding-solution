import boto3
import os
import subprocess
import shutil
import re
from urllib.parse import unquote_plus
from botocore.config import Config
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
dataset_table = dynamodb.Table('serverless-video-transcode-datasets')
s3_client = boto3.client('s3', os.environ['AWS_REGION'], config=Config(s3={'addressing_style': 'path'}))
efs_path = os.environ['EFS_PATH']


def merge_video(segment_list):
    media_file = segment_list[0]

    video_prefix = media_file.split('.')[0]
    video_filename = video_prefix + '_merged.mp4'

    with open("segmentlist.txt", "w") as f:
        for segment in segment_list:
            f.write('file {} \n'.format(segment))

    # merge video segments
    cmd = ['ffmpeg', '-loglevel', 'error', '-f', 'concat', '-safe',
           '0', '-i', 'segmentlist.txt', '-c', 'copy', video_filename]

    print("merge video segments ....")
    subprocess.call(cmd)

    return video_filename


def lambda_handler(event, context):

    if len(event) == 0:
        return {}

    print(event)

    download_dir = event[0][0]['download_dir']
    s3_bucket = event[0][0]['s3_bucket']
    s3_prefix = event[0][0]['s3_prefix']


    os.chdir(download_dir)

    segment_list = []

    for segment_group in event:
        for segment in segment_group:
            segment_list.append(segment['transcoded_segment'])

    object_name = event[0][0]['object_name']
    key = s3_prefix + object_name
    response = dataset_table.query(
        IndexName='s3_key-index',
        KeyConditionExpression=Key('s3_key').eq(key)
    )
    item = response['Items'][0]

    try:
        merged_file = merge_video(segment_list)
    except Exception as exp:
        item['status'] = 'Failed to merge input video, detail error:' + exp
        dataset_table.put_item(Item=item)
        raise

    # upload merged media to S3
    job_id = download_dir.split("/")[-1]


    # bucket = os.environ['MEDIA_BUCKET']
    # key = 'output/{}/{}'.format(job_id, object_name)
    bucket = s3_bucket
    input_key = s3_prefix +'output/' + object_name
    print("GUMING DEBUG>>> new key is " + input_key)

    s3_client.upload_file(merged_file, bucket, input_key, ExtraArgs={'ContentType': 'video/mp4'})
    # delete the temp download directory
    shutil.rmtree(download_dir)


    # Generate the URL to get 'key-name' from 'bucket-name'
    url = s3_client.generate_presigned_url(
        ClientMethod='get_object',
        Params={
            'Bucket': bucket,
            'Key': input_key
        }
    )
    print(url)


    print(response)

    item['status'] = 'Transcoding Completed'
    item['signed_url'] = url
    dataset_table.put_item(Item=item)

    return {
        'download_dir': download_dir,
        'input_segments': len(segment_list),
        'merged_video': merged_file,
        'create_hls': 0,
        'output_bucket': bucket,
        'output_key': key
    }
