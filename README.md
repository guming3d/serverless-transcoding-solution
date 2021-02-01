# Serverless Video Transcode Solution

Many Amazon Web Services (AWS) customers require a data storage and analytics solution that offers more agility and flexibility than traditional data management systems. A Serverless Video Transcode is an increasingly popular way to store and analyze data because it allows businesses to store all of their data, structured and unstructured, in a centralized repository. The AWS Cloud provides many of the building blocks required to help businesses implement a secure, flexible, and cost-effective Serverless Video Transcode.

The Serverless Video Transcode solution is an automated reference implementation that deploys a highly available, cost-effective Serverless Video Transcode architecture on the AWS Cloud.  The solution is intended to address common customer pain points around conceptualizing Serverless Video Transcode architectures, and automatically configures the core AWS services necessary to easily tag, search, share, and govern specific subsets of data across a business or with other external businesses. This solution allows users to catalog new datasets, and to create data profiles for existing datasets in Amazon Simple Storage Service (Amazon S3) and integrate with solutions like AWS Glue and Amazon Athena with minimal effort.

For the full solution overview visit [Serverless Video Transcode on AWS](https://aws.amazon.com/answers/big-data/data-lake-solution).

For help when using the Serverless Video Transcode solution, visit the [online help guide](http://docs.awssolutionsbuilder.com/data-lake/).

## File Structure
The Serverless Video Transcode project consists of microservices that facilitate the functional areas of the solution. These microservices are deployed to a serverless environment in AWS Lambda.

<pre>
|-deployment/ [folder containing templates and build scripts]
|-source/
  |-api/
    |-authorizer/ [custom authorizer for api gateway]
    |-services/
      |-admin/ [microservice for Serverless Video Transcode administrative functionality]
      |-cart/ [microservice for Serverless Video Transcode cart functionality]
      |-logging/ [microservice for Serverless Video Transcode audit logging]
      |-manifest/ [microservice for Serverless Video Transcode manifest processing]
      |-package/ [microservice for Serverless Video Transcode package functionality]
      |-profile/ [microservice for Serverless Video Transcode user profile functionality]
      |-search/ [microservice for Serverless Video Transcode search functionality]
  |-cli/ [Serverless Video Transcode command line interface]
  |-console/ [Serverless Video Transcode angularjs management console]
  |-resource/
    |-access-validator/ [auxiliar module used to validate granular permissions]
    |-helper/ [custom helper for CloudFormation deployment template]
</pre>
Each microservice follows the structure of:

<pre>
|-service-name/
  |-lib/
    |-[service module libraries and unit tests]
  |-index.js [injection point for microservice]
  |-package.json
</pre>

## Getting Started

#### 01. Prerequisites
The following procedures assumes that all of the OS-level configuration has been completed. They are:

* [AWS Command Line Interface](https://aws.amazon.com/cli/)
* Node.js 12.x

The Serverless Video Transcode solution is developed with Node.js for the microservices that run in AWS Lambda and Angular 1.x for the console user interface. The latest version of the Serverless Video Transcode solution has been tested with Node.js v12.x.

#### 02. Build the Serverless Video Transcode solution
Clone the aws-data-lake-solution GitHub repository:

```
git clone https://github.com/awslabs/aws-data-lake-solution.git
```

#### 03. Declare enviroment variables:

```
export AWS_REGION=<aws-region-code>
export VERSION_CODE=<version-code>
export DEPLOY_BUCKET=<source-bucket-base-name>
```
- **aws-region-code**: AWS region code. Ex: ```us-east-1```, ```us-west-2``` ...
- **version-code**: version of the package
- **source-bucket-base-name**: Name for the S3 bucket location where the template will source the Lambda code from. The template will append ```-[aws-region-code]``` to this bucket name. For example: ```./build-s3-dist.sh solutions v2.0.0```, the template will then expect the source code to be located in the ```solutions-[aws-region-code]``` bucket.

#### 04. Run the Serverless Video Transcode solution unit tests:
```
cd ./aws-data-lake-solution/deployment
chmod +x run-unit-tests.sh
./run-unit-tests.sh
```

#### 05. Build the Serverless Video Transcode solution for deployment:
```
chmod +x build-s3-dist.sh
./build-s3-dist.sh $DEPLOY_BUCKET $VERSION_CODE
```

#### 06. Upload deployment assets to your Amazon S3 bucket:
```
aws s3 cp ./dist s3://$DEPLOY_BUCKET/data-lake/$VERSION_CODE --recursive --acl bucket-owner-full-control
```

#### 07. Deploy the Serverless Video Transcode solution:
* From your designated Amazon S3 bucket where you uploaded the deployment assets, copy the link location for the data-lake-deploy.template or data-lake-deploy-federated.template.
* Using AWS CloudFormation, launch the Serverless Video Transcode solution stack using the copied Amazon S3 link for the data-lake-deploy.template or data-lake-deploy-federated.template.

> Currently, the Serverless Video Transcode solution can be deployed in the following regions: [ us-east-1, us-east-2, us-west-2, eu-west-1, eu-west-2, eu-central-1, ap-northeast-1, ap-northeast-2, ap-southeast-2, ap-south-1 ]

***

Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0 

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
