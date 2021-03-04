import os
import re
import subprocess
from urllib.parse import unquote_plus


def transcode_segment(presigned_url, start_ts, duration, segment_order, options):
    output_filename = 'tmp_' + str(segment_order) + '.mp4'

    # extract all i-frames as thumbnails
    cmd = ['ffmpeg', '-v', 'error', '-ss', str(start_ts - 1), '-i', presigned_url, '-ss', '1', '-t', str(duration), '-vf', "scale=-1:" + options['resolution'], '-x264opts', 'stitchable', '-c:a', 'copy', '-y', output_filename]

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

    result = transcode_segment(presigned_url, start_ts, duration, segment_order, options)

    return {
        'download_dir': download_dir,
        'transcoded_segment': result,
        'segment_order': segment_order,
        'object_name': object_name,
        's3_bucket': event['s3_bucket'],
        's3_prefix': event['s3_prefix']
    }
