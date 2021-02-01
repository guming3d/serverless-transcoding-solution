export AWS_REGION=cn-north-1
export VERSION_CODE=v2.3
export DEPLOY_BUCKET=serverless-video-transcode-cn-deploy-new
export SOLUTION_NAME=serverless-video-transcode-cn-new

#aws s3api delete-bucket --bucket serverless-video-transcode-cn-852226251499-cn-north-1-s3-access-log --region cn-north-1
aws s3 rb s3://serverless-video-transcode-cn-812669741844-cn-north-1-s3-access-log --force
#aws s3api delete-bucket --bucket serverless-video-transcode-cn-852226251499-cn-north-1-cf-access-log --region cn-north-1
aws s3 rb s3://serverless-video-transcode-cn-812669741844-cn-north-1-cf-access-log --force

#aws cloudformation delete-stack --stack-name AWSServerlessVideoTranscode


#./build-s3-dist.sh solutions trademarked-solution-name v1.0.0 cf-template-bucket"
./build-s3-dist.sh $SOLUTION_NAME $SOLUTION_NAME $VERSION_CODE $DEPLOY_BUCKET

aws s3 cp ./regional-s3-assets s3://$SOLUTION_NAME-$AWS_REGION/$SOLUTION_NAME/$VERSION_CODE --recursive --acl bucket-owner-full-control
aws s3 cp ./global-s3-assets s3://$DEPLOY_BUCKET/$SOLUTION_NAME/$VERSION_CODE --recursive --acl bucket-owner-full-control


sleep 5

aws cloudformation create-stack --stack-name AWSServerlessVideoTranscode --template-body file:///home/minggu/code/Aws-serverless-video-transcode-solution-cn/deployment/global-s3-assets/serverless-video-transcode-deploy.template --parameters '[{"ParameterKey":"AdministratorName","ParameterValue":"minggu"}, {"ParameterKey":"AdministratorEmail","ParameterValue":"minggu@amazon.com"}, {"ParameterKey":"CognitoDomain","ParameterValue":"serverless-video-transcode-cn"}, {"ParameterKey":"KeycloakDomain","ParameterValue":"https://nwkeycloak.ch.xiaopeiqing.com"},{"ParameterKey":"KeycloakRealm","ParameterValue":"serverless-video-transcode-test"}, {"ParameterKey":"KeycloakClientId","ParameterValue":"serverless-video-transcode"}]' --capabilities CAPABILITY_NAMED_IAM

#aws cloudformation update-stack --stack-name AWSServerlessVideoTranscode --template-body file:///home/minggu/code/Aws-serverless-video-transcode-solution-cn/deployment/global-s3-assets/serverless-video-transcode-deploy.template --parameters '[{"ParameterKey":"AdministratorName","ParameterValue":"minggu"}, {"ParameterKey":"AdministratorEmail","ParameterValue":"minggu@amazon.com"}, {"ParameterKey":"CognitoDomain","ParameterValue":"serverless-video-transcode-cn"}]' --capabilities CAPABILITY_NAMED_IAM
