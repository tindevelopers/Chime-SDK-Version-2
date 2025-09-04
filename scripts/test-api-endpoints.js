const https = require('https');

const API_BASE_URL = 'https://xxzrb5vqse.execute-api.us-east-1.amazonaws.com/dev';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'xxzrb5vqse.execute-api.us-east-1.amazonaws.com',
      port: 443,
      path: `/dev${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // We'll need a real token for actual testing
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: response
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPIEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');
  
  const tests = [
    {
      name: 'Auth Endpoint',
      method: 'GET',
      path: '/auth',
      data: null
    },
    {
      name: 'Get Meetings',
      method: 'GET',
      path: '/meetings',
      data: null
    },
    {
      name: 'Create Meeting',
      method: 'POST',
      path: '/meetings',
      data: {
        title: 'Test Meeting',
        description: 'Test meeting for API testing',
        max_participants: 10,
        recording_enabled: true,
        chat_enabled: true,
        screen_sharing_enabled: true
      }
    },
    {
      name: 'Get Voice Connectors',
      method: 'GET',
      path: '/voice-connectors',
      data: null
    },
    {
      name: 'Search Phone Numbers',
      method: 'GET',
      path: '/phone-numbers/search?countryCode=US&phoneNumberType=Local',
      data: null
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await makeRequest(test.method, test.path, test.data);
      console.log(`✅ ${test.name}: ${response.statusCode}`);
      if (response.statusCode === 200) {
        console.log(`   Response: ${JSON.stringify(response.body, null, 2).substring(0, 200)}...`);
      } else {
        console.log(`   Error: ${JSON.stringify(response.body, null, 2)}`);
      }
      console.log('');
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`);
      console.log('');
    }
  }
}

// Run the tests
testAPIEndpoints().catch(console.error);
