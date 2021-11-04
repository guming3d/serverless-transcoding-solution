import boto3
import os
import subprocess
import shutil
from botocore.config import Config
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
dataset_table = dynamodb.Table('serverless-video-transcode-datasets')
workflow_table = dynamodb.Table('serverless-video-transcode-status')

# runtime_region = os.environ['AWS_REGION']

# s3_client = boto3.client('s3', runtime_region, config=Config(s3={'addressing_style': 'path'}))
# efs_path = os.environ['EFS_PATH']

def merge_video(segment_list, bucket, output_key):
    media_file = segment_list[0]

    video_prefix = media_file.split('.')[0]
    video_filename = video_prefix + '_merged.mp4'

    output_name = 's3://'+bucket+'/'+output_key

    print("guming debug>> " +  output_name)
    with open("/tmp/segmentlist.txt", "w") as f:
        for segment in segment_list:
            print(segment)
            f.write('file {} \n'.format(segment))

    # merge video segments
    # cmd = ['ffmpeg', '-loglevel', 'error', '-f', 'concat', '-safe',
    #       '0', '-i', 'segmentlist.txt', '-c', 'copy', video_filename]
    cmd = ['ffmpeg', '-loglevel', 'error', '-protocol_whitelist', 'file,http,https,tcp,tls,crypto', '-f', 'concat', '-safe',
           '0', '-i', '/tmp/segmentlist.txt', '-f','mp4', '-movflags', 'frag_keyframe+empty_moov', '-bsf:a', 'aac_adtstoasc', '-c', 'copy']
    cmd.append('- |')
    cmd.append('/opt/awscli/aws s3 cp - ')
    cmd.append(output_name)

    shell_cmd= ' '.join(cmd)
    print(shell_cmd)

    print("merge video segments ....")
    print(subprocess.check_output(shell_cmd, shell=True))

    return output_name

def lambda_handler(event, context):

    if len(event) == 0:
        return {}

    print(event)

    s3_bucket = event[0][0]['s3_bucket']
    s3_prefix = event[0][0]['s3_prefix']
    options = event[0][0]['options']

    if 'AWSRegion' in options:
        s3_client = boto3.client('s3', options['AWSRegion'], config=Config(
             s3={'addressing_style': 'path'}))
    else:
        s3_client = boto3.client('s3', os.environ['AWS_REGION'], config=Config(
             s3={'addressing_style': 'path'}))
    segment_list = []

    for segment_group in event:
        for segment in segment_group:
            #generate presigned url
            tmp_bucket = segment['transcoded_segment']['bucket']
            tmp_key = segment['transcoded_segment']['key']
            segment_list.append(s3_client.generate_presigned_url(
                ClientMethod='get_object',
                Params={
                    'Bucket': tmp_bucket,
                    'Key': tmp_key
                },
                ExpiresIn=604800
            ))
            print(segment_list)

    object_name = event[0][0]['object_name']
    key = s3_prefix + object_name
    response = dataset_table.query(
        IndexName='s3_key-index',
        KeyConditionExpression=Key('s3_key').eq(key)
    )

    if len(response['Items']) > 0:
        item = response['Items'][0]

    # upload merged media to S3
    bucket = s3_bucket
    input_key = s3_prefix +'output/' + object_name

    try:
        merged_file = merge_video(segment_list,bucket,input_key)
    except Exception as exp:
        if len(response['Items']) > 0:
            item['status'] = 'Failed to merge input video, detail error:'
            dataset_table.put_item(Item=item)
        raise

    for segment_group in event:
        for segment in segment_group:
            #delete the tmp videos
            tmp_bucket = segment['transcoded_segment']['bucket']
            tmp_key = segment['transcoded_segment']['key']
            s3_client.delete_object(
                Bucket= tmp_bucket,
                Key= tmp_key,
            )


    # Generate the URL to get 'key-name' from 'bucket-name'
    url = s3_client.generate_presigned_url(
        ClientMethod='get_object',
        Params={
            'Bucket': bucket,
            'Key': input_key
        },
        ExpiresIn=604800
    )
    print(response)

    if len(response['Items']) > 0:
        item['status'] = 'Transcoding Completed'
        item['signed_url'] = url
        dataset_table.put_item(Item=item)

    return {
        'input_segments': len(segment_list),
        'merged_video': merged_file,
        'create_hls': 0,
        'output_bucket': bucket,
        'output_key': key
    }
