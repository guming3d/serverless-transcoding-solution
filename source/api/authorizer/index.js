let AWS = require('aws-sdk');
let creds = new AWS.EnvironmentCredentials('AWS'); // Lambda provided credentials
const dynamoConfig = {
  credentials: creds,
  region: process.env.AWS_REGION
};


var generatePolicy = function(principalId, effect, resource) {
  var authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    var policyDocument = {};
    policyDocument.Version = '2012-10-17'; // default version
    policyDocument.Statement = [];
    var statementOne = {};
    statementOne.Action = 'execute-api:Invoke'; // default action
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  return authResponse;
};

function extractTokenFromHeader(e) {
  if (e.authorizationToken && e.authorizationToken.split(':')[0] === 'tk') {
    return e.authorizationToken.split(':')[1];
  } else {
    return e.authorizationToken;
  }
}

function validateToken(token, event, callback) {
  getConfigInfo(function(err, config) {
    if (err) {
      return callback("Failed to get Config info, Unauthorized");
    }

    let targetToken = `${config.Item.setting.uuid}`
    if (targetToken == token){
      callback(null, generatePolicy("serverless-video-transcode", 'Allow', event.methodArn))
    } else {
      console.log("targetToken is " + targetToken);
      console.log("input token is " + token);
      return callback("Unauthorized");
    }
    
  });
}

exports.handler = (event, context, callback) => {
  let token = extractTokenFromHeader(event) || '';
  // callback(null, generatePolicy("serverless-video-transcode", 'Allow', event.methodArn))
  validateToken(token, event, callback);
}

var getConfigInfo = function(cb) {
  console.log('Retrieving app-config information...');
  let params = {
    TableName: 'serverless-video-transcode-settings',
    Key: {
      setting_id: 'app-config'
    }
  };

  let docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
  if (typeof cb !== 'undefined') {
    docClient.get(params, function(err, data) {
      if (err) {
        console.log(err);
        return cb({code: 502, message: "Failed to retrieving app configuration settings [ddb]."}, null);
      }

      return cb(null, data);
    });
  } else {
    return docClient.get(params).promise();
  }

};