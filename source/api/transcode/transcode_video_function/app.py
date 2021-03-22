import boto3
import os
import subprocess
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
dataset_table = dynamodb.Table('serverless-video-transcode-datasets')

def transcode_segment(presigned_url, start_ts, duration, segment_order, options):
    output_filename = 'tmp_' + str(segment_order) + '.mp4'

    # extract all i-frames as thumbnails
    # cmd = ['ffmpeg', '-v', 'error', '-ss', str(start_ts - 1), '-i', presigned_url, '-ss', '1', '-t', str(duration),'-b:v', options['bitrate'], '-vf', 'scale=-1:' + options['resolution'], '-c:v', 'libx265', '-an', '-x265-params','stitchable=1', '-c:a', 'copy', '-y', output_filename]

    cmd = ['ffmpeg', '-v', 'error', '-ss', str(start_ts - 1), '-i', presigned_url, '-ss', '1', '-t', str(duration)]
    if options['manualOptions'] == '':
        if options['bitrate'] != 'ORIGINAL':
            cmd.append('-b:v')
            cmd.append(options['bitrate'])
        if options['resolution'] != 'ORIGINAL':
            cmd.append('-vf')
            cmd.append('scale=-1:'+options['resolution'])
        if options['codec'] != 'ORIGINAL':
            if options['codec'] == 'h264':
                cmd.append('-c:v')
                cmd.append('libx264')
                cmd.append('-an')
                cmd.append('-x264-params')
                cmd.append('stitchable=1')
            elif options['codec'] == 'h265':
                cmd.append('-c:v')
                cmd.append('libx265')
                cmd.append('-an')
                cmd.append('-x265-params')
                cmd.append('stitchable=1')
    else:
        subParameter = options['manualOptions'].split(' ')
        for subs in subParameter:
            cmd.append(subs)

    cmd.append('-c:a')
    cmd.append('copy')
    cmd.append('-y')
    cmd.append(output_filename)

    # create thumbnails
    print("trancoding the segment")
    subprocess.check_output(cmd)

    return output_filename


def lambda_handler(event, context):
    download_dir = event['download_dir']
    os.chdir(download_dir)
    presigned_url = event['presigned_url']
    object_name = event['object_name']
    start_ts = event['video_segment']['start_ts']
    duration = event['video_segment']['duration']
    segment_order = event['video_segment']['segment_order']
    options = event['options']
    s3_prefix = event['s3_prefix']

    key = s3_prefix + object_name
    response = dataset_table.query(
        IndexName='s3_key-index',
        KeyConditionExpression=Key('s3_key').eq(key)
    )
    item = response['Items'][0]

    try:
        result = transcode_segment(presigned_url, start_ts, duration, segment_order, options)
    except Exception as exp:
        item['status'] = "Failed to transcode input video, detail error:" + str(exp)
        dataset_table.put_item(Item=item)
        raise

    return {
        'download_dir': download_dir,
        'transcoded_segment': result,
        'segment_order': segment_order,
        'object_name': object_name,
        's3_bucket': event['s3_bucket'],
        's3_prefix': event['s3_prefix']
    }
