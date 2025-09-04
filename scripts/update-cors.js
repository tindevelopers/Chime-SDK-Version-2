const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const apigateway = new AWS.APIGateway();

async function updateCorsSettings() {
  try {
    // Get the API ID
    const apis = await apigateway.getRestApis().promise();
    const api = apis.items.find(api => api.name === 'video-conferencing-platform-dev');
    
    if (!api) {
      console.error('API not found');
      return;
    }

    console.log('Found API:', api.id);

    // Get the root resource
    const resources = await apigateway.getResources({ restApiId: api.id }).promise();
    const rootResource = resources.items.find(resource => resource.path === '/');

    if (!rootResource) {
      console.error('Root resource not found');
      return;
    }

    console.log('Found root resource:', rootResource.id);

    // Add OPTIONS method to root resource
    try {
      await apigateway.putMethod({
        restApiId: api.id,
        resourceId: rootResource.id,
        httpMethod: 'OPTIONS',
        authorizationType: 'NONE'
      }).promise();
      console.log('Added OPTIONS method');
    } catch (error) {
      if (error.code !== 'ConflictException') {
        throw error;
      }
      console.log('OPTIONS method already exists');
    }

    // Add integration for OPTIONS method
    try {
      await apigateway.putIntegration({
        restApiId: api.id,
        resourceId: rootResource.id,
        httpMethod: 'OPTIONS',
        type: 'MOCK',
        requestTemplates: {
          'application/json': '{"statusCode": 200}'
        }
      }).promise();
      console.log('Added OPTIONS integration');
    } catch (error) {
      if (error.code !== 'ConflictException') {
        throw error;
      }
      console.log('OPTIONS integration already exists');
    }

    // Add method response for OPTIONS
    try {
      await apigateway.putMethodResponse({
        restApiId: api.id,
        resourceId: rootResource.id,
        httpMethod: 'OPTIONS',
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Origin': true
        }
      }).promise();
      console.log('Added OPTIONS method response');
    } catch (error) {
      if (error.code !== 'ConflictException') {
        throw error;
      }
      console.log('OPTIONS method response already exists');
    }

    // Add integration response for OPTIONS
    try {
      await apigateway.putIntegrationResponse({
        restApiId: api.id,
        resourceId: rootResource.id,
        httpMethod: 'OPTIONS',
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
          'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
          'method.response.header.Access-Control-Allow-Origin': "'http://localhost:3000'"
        }
      }).promise();
      console.log('Added OPTIONS integration response');
    } catch (error) {
      if (error.code !== 'ConflictException') {
        throw error;
      }
      console.log('OPTIONS integration response already exists');
    }

    // Also update the meetings resource CORS settings
    const meetingsResource = resources.items.find(resource => resource.path === '/meetings');
    if (meetingsResource) {
      console.log('Found meetings resource:', meetingsResource.id);
      
      // Add OPTIONS method to meetings resource
      try {
        await apigateway.putMethod({
          restApiId: api.id,
          resourceId: meetingsResource.id,
          httpMethod: 'OPTIONS',
          authorizationType: 'NONE'
        }).promise();
        console.log('Added OPTIONS method to meetings resource');
      } catch (error) {
        if (error.code !== 'ConflictException') {
          console.log('Error adding OPTIONS method to meetings:', error.message);
        } else {
          console.log('OPTIONS method already exists on meetings resource');
        }
      }

      // Add integration for OPTIONS method on meetings
      try {
        await apigateway.putIntegration({
          restApiId: api.id,
          resourceId: meetingsResource.id,
          httpMethod: 'OPTIONS',
          type: 'MOCK',
          requestTemplates: {
            'application/json': '{"statusCode": 200}'
          }
        }).promise();
        console.log('Added OPTIONS integration to meetings resource');
      } catch (error) {
        if (error.code !== 'ConflictException') {
          console.log('Error adding OPTIONS integration to meetings:', error.message);
        } else {
          console.log('OPTIONS integration already exists on meetings resource');
        }
      }

      // Add method response for OPTIONS on meetings
      try {
        await apigateway.putMethodResponse({
          restApiId: api.id,
          resourceId: meetingsResource.id,
          httpMethod: 'OPTIONS',
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Origin': true
          }
        }).promise();
        console.log('Added OPTIONS method response to meetings resource');
      } catch (error) {
        if (error.code !== 'ConflictException') {
          console.log('Error adding OPTIONS method response to meetings:', error.message);
        } else {
          console.log('OPTIONS method response already exists on meetings resource');
        }
      }

      // Add integration response for OPTIONS on meetings
      try {
        await apigateway.putIntegrationResponse({
          restApiId: api.id,
          resourceId: meetingsResource.id,
          httpMethod: 'OPTIONS',
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
            'method.response.header.Access-Control-Allow-Origin': "'http://localhost:3000'"
          }
        }).promise();
        console.log('Added OPTIONS integration response to meetings resource');
      } catch (error) {
        if (error.code !== 'ConflictException') {
          console.log('Error adding OPTIONS integration response to meetings:', error.message);
        } else {
          console.log('OPTIONS integration response already exists on meetings resource');
        }
      }
    }

    // Deploy the API
    await apigateway.createDeployment({
      restApiId: api.id,
      stageName: 'dev'
    }).promise();
    console.log('Deployed API changes');

    console.log('CORS settings updated successfully!');
  } catch (error) {
    console.error('Error updating CORS settings:', error);
  }
}

updateCorsSettings();
