#set -e
export AWS_REGION=cn-north-1
export VERSION_CODE=v1.0
export DEPLOY_BUCKET=serverless-video-transcode-cn-merge
export SOLUTION_NAME=serverless-video-transcode-cn-merge
export DEPLOY_TEMPLATE=file:///Users/minggu/work/serverlessVideoTranscode/code/ServerlessVideoTranscode-Solution/deployment/global-s3-assets/serverless-video-transcode-deploy.template
export KEYCLOAK_DOMAIN=https://keycloak.minggu.dev.marketplace.aws.a2z.org.cn
export KEYCLOAK_REALM=test
export KEYCLOAK_CLIENTID=slt
export VIDEO_BUCKET=merge-test-guming3d

./build-s3-dist.sh $SOLUTION_NAME $SOLUTION_NAME $VERSION_CODE $DEPLOY_BUCKET


aws s3 rb s3://v1.0-812669741844-cn-north-1-s3-access-log --force
aws s3 rb s3://v1.0-812669741844-cn-north-1-cf-access-log --force

aws s3 cp ./regional-s3-assets s3://$SOLUTION_NAME-$AWS_REGION/$SOLUTION_NAME/$VERSION_CODE --recursive --acl bucket-owner-full-control
aws s3 cp ./regional-s3-assets s3://$SOLUTION_NAME-$AWS_REGION/$VERSION_CODE/$DEPLOY_BUCKET --recursive --acl bucket-owner-full-control

aws s3 cp ./regional-s3-assets s3://$SOLUTION_NAME/$SOLUTION_NAME/$VERSION_CODE --recursive --acl bucket-owner-full-control
aws s3 cp ./global-s3-assets s3://$SOLUTION_NAME/$VERSION_CODE/$DEPLOY_BUCKET --recursive --acl bucket-owner-full-control
aws s3 cp ./global-s3-assets s3://$DEPLOY_BUCKET/$SOLUTION_NAME/$VERSION_CODE --recursive --acl bucket-owner-full-control

sleep 3

#aws cloudformation create-stack --stack-name AWSServerlessVideoTranscode --template-body $DEPLOY_TEMPLATE --parameters '[{"ParameterKey":"KeycloakDomain","ParameterValue": "https://keycloak.minggu.dev.marketplace.aws.a2z.org.cn" },{"ParameterKey":"KeycloakRealm","ParameterValue": "serverless-video-transcode-test" }, {"ParameterKey": "KeycloakClientId", "ParameterValue": "serverless-video-transcode" }]' --capabilities CAPABILITY_NAMED_IAM
#aws cloudformation create-stack --stack-name AWSServerlessVideoTranscode --template-body $DEPLOY_TEMPLATE --parameters "[{\"ParameterKey\":\"KeycloakDomain\",\"ParameterValue\": $KEYCLOAK_DOMAIN },{\"ParameterKey\":\"KeycloakRealm\",\"ParameterValue\": $KEYCLOAK_REALM }, {\"ParameterKey\":\"KeycloakClientId\",\"ParameterValue\": $KEYCLOAK_CLIENTID }]" --capabilities CAPABILITY_NAMED_IAM
