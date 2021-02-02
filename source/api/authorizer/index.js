const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const keyClient = jwksClient({
  cache: true,
  cacheMaxAge: 86400000, //value in ms
  rateLimit: true,
  jwksRequestsPerMinute: 10,
  strictSsl: true,
  jwksUri: process.env.KEYCLOAK_DOMAIN + '/auth/realms/' + process.env.KEYCLOAK_REALM +'/protocol/openid-connect/certs'
})

const verificationOptions = {
  // verify claims, e.g.
  // "audience": "urn:audience"
  "algorithms": "RS256"
}

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

function getSigningKey (header = decoded.header, callback) {
  keyClient.getSigningKey(header.kid, function(err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  })
}

function extractTokenFromHeader(e) {
  if (e.authorizationToken && e.authorizationToken.split(':')[0] === 'tk') {
    return e.authorizationToken.split(':')[1];
  } else {
    return e.authorizationToken;
  }
}

function validateToken(token, event, callback) {
  jwt.verify(token, getSigningKey, verificationOptions, function (error) {
    if (error) {
      callback("Unauthorized")
    } else {
      callback(null, generatePolicy("serverless-video-transcode", 'Allow', event.methodArn))
    }
  })
}

exports.handler = (event, context, callback) => {
  let token = extractTokenFromHeader(event) || '';
  callback(null, generatePolicy("serverless-video-transcode", 'Allow', event.methodArn))
  // validateToken(token, event, callback);
}