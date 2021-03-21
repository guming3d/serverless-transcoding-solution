export AWS_REGION=us-east-1
export VERSION_CODE=v1.0
export DEPLOY_BUCKET=serverless-video-transcode-minggu-deploy
export SOLUTION_NAME=serverless-video-transcode-minggu
export ACCOUNT_ID=283654161904


#./build-s3-dist.sh solutions trademarked-solution-name v1.0.0 cf-template-bucket"
./build-s3-dist.sh $SOLUTION_NAME $SOLUTION_NAME $VERSION_CODE $DEPLOY_BUCKET

aws s3 cp ./regional-s3-assets s3://$SOLUTION_NAME-$AWS_REGION/$SOLUTION_NAME/$VERSION_CODE --recursive --acl bucket-owner-full-control
aws s3 cp ./global-s3-assets s3://$DEPLOY_BUCKET/$SOLUTION_NAME/$VERSION_CODE --recursive --acl bucket-owner-full-control

aws s3 cp ./regional-s3-assets/site s3://serverless-video-transcode-web_AWS_REGION-$ACCOUNT_ID/ --recursive --acl bucket-owner-full-control