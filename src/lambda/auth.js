const { CognitoIdentityProviderClient, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const client = jwksClient({
  jwksUri: `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_2lpfwBcaO/.well-known/jwks.json`
});

// Helper function to get Cognito public key
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Verify JWT token
function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      audience: 'uus0oqfhqto7lo0rud3nco8a0', // Cognito Client ID
      issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_2lpfwBcaO'
    }, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

// Get user from Cognito
async function getUserFromCognito(cognitoUserId) {
  try {
    const params = {
      UserPoolId: 'us-east-1_2lpfwBcaO',
      Username: cognitoUserId
    };
    
    const command = new AdminGetUserCommand(params);
    const result = await cognito.send(command);
    
    const user = {
      cognito_user_id: cognitoUserId,
      email: '',
      first_name: '',
      last_name: ''
    };
    
    result.UserAttributes.forEach(attr => {
      switch (attr.Name) {
        case 'email':
          user.email = attr.Value;
          break;
        case 'given_name':
          user.first_name = attr.Value;
          break;
        case 'family_name':
          user.last_name = attr.Value;
          break;
      }
    });
    
    return user;
  } catch (error) {
    console.error('Error getting user from Cognito:', error);
    throw error;
  }
}

// Main handler
exports.handler = async (event) => {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          error: 'No authorization token provided'
        })
      };
    }
    
    // Verify the token
    const decoded = await verifyToken(token);
    
    // Get user from Cognito
    const user = await getUserFromCognito(decoded.sub);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        user: user,
        cognito_user_id: decoded.sub,
        email: decoded.email,
        exp: decoded.exp
      })
    };
    
  } catch (error) {
    console.error('Authentication error:', error);
    
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        error: 'Invalid or expired token'
      })
    };
  }
};
