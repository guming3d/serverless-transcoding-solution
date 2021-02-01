export AWS_REGION=cn-north-1
export VERSION_CODE=v1.0
export DEPLOY_BUCKET=serverless-video-transcode-cn-deploy
export SOLUTION_NAME=serverless-video-transcode-cn
export DEPLOY_TEMPLATE=file:///home/minggu/code/AWSServerlessVideoTranscode/deployment/global-s3-assets/serverless-video-transcode-deploy.template
export KEYCLOAK_DOMAIN=https://keycloak.minggu.dev.marketplace.aws.a2z.org.cn
export KEYCLOAK_REALM=serverless-video-transcode-test
export KEYCLOAK_CLIENTID=serverless-video-transcode

./build-s3-dist.sh $SOLUTION_NAME $SOLUTION_NAME $VERSION_CODE $DEPLOY_BUCKET

aws s3 cp ./regional-s3-assets s3://$SOLUTION_NAME-$AWS_REGION/$SOLUTION_NAME/$VERSION_CODE --recursive --acl bucket-owner-full-control
aws s3 cp ./global-s3-assets s3://$DEPLOY_BUCKET/$SOLUTION_NAME/$VERSION_CODE --recursive --acl bucket-owner-full-control

sleep 5
exit 0

aws cloudformation create-stack --stack-name AWSServerlessVideoTranscode --template-body $DEPLOY_TEMPLATE --parameters "[{\"ParameterKey\":\"KeycloakDomain\",\"ParameterValue\": $KEYCLOAK_DOMAIN},{\"ParameterKey\":\"KeycloakRealm\",\"ParameterValue\": $KEYCLOAK_REALM}, {\"ParameterKey\":\"KeycloakClientId\",\"ParameterValue\": $KEYCLOAK_CLIENTID}]" --capabilities CAPABILITY_NAMED_IAM
