const { ChimeSDKVoiceClient, CreateVoiceConnectorCommand, GetVoiceConnectorCommand, ListVoiceConnectorsCommand, DeleteVoiceConnectorCommand, SearchAvailablePhoneNumbersCommand, CreatePhoneNumberOrderCommand, AssociatePhoneNumbersWithVoiceConnectorCommand, DisassociatePhoneNumbersFromVoiceConnectorCommand, CreateSipMediaApplicationCommand, CreateSipRuleCommand } = require('@aws-sdk/client-chime-sdk-voice');
const { Pool } = require('pg');

// Initialize ChimeSDK Voice client
const chimeSDKVoice = new ChimeSDKVoiceClient({ region: 'us-east-1' });

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

// Helper function to verify JWT token (simplified)
async function verifyToken(event) {
  const token = event.headers.Authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No authorization token provided');
  }
  
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return {
      cognito_user_id: payload.sub,
      email: payload.email
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Create a Voice Connector
async function createVoiceConnector(name, region = 'us-east-1') {
  try {
    const params = {
      Name: name,
      AwsRegion: region,
      RequireEncryption: true
    };

    const result = await chimeSDKVoice.send(new CreateVoiceConnectorCommand(params));
    return result.VoiceConnector;
  } catch (error) {
    console.error('Error creating Voice Connector:', error);
    throw error;
  }
}

// Get Voice Connector details
async function getVoiceConnector(voiceConnectorId) {
  try {
    const params = {
      VoiceConnectorId: voiceConnectorId
    };

    const result = await chimeSDKVoice.send(new GetVoiceConnectorCommand(params));
    return result.VoiceConnector;
  } catch (error) {
    console.error('Error getting Voice Connector:', error);
    throw error;
  }
}

// List Voice Connectors
async function listVoiceConnectors() {
  try {
    const params = {
      MaxResults: 100
    };

    const result = await chimeSDKVoice.send(new ListVoiceConnectorsCommand(params));
    return result.VoiceConnectors;
  } catch (error) {
    console.error('Error listing Voice Connectors:', error);
    throw error;
  }
}

// Delete a Voice Connector
async function deleteVoiceConnector(voiceConnectorId) {
  try {
    const params = {
      VoiceConnectorId: voiceConnectorId
    };

    await chimeSDKVoice.send(new DeleteVoiceConnectorCommand(params));
    return { success: true };
  } catch (error) {
    console.error('Error deleting Voice Connector:', error);
    throw error;
  }
}

// Search available phone numbers
async function searchAvailablePhoneNumbers(countryCode = 'US', phoneNumberType = 'Local') {
  try {
    const params = {
      CountryCode: countryCode,
      PhoneNumberType: phoneNumberType,
      MaxResults: 10
    };

    const result = await chimeSDKVoice.send(new SearchAvailablePhoneNumbersCommand(params));
    return result.E164PhoneNumbers;
  } catch (error) {
    console.error('Error searching phone numbers:', error);
    throw error;
  }
}

// Order phone numbers
async function orderPhoneNumbers(phoneNumbers, voiceConnectorId) {
  try {
    const params = {
      ProductType: 'VoiceConnector',
      E164PhoneNumbers: phoneNumbers
    };

    const result = await chimeSDKVoice.send(new CreatePhoneNumberOrderCommand(params));
    return result.OrderedPhoneNumbers;
  } catch (error) {
    console.error('Error ordering phone numbers:', error);
    throw error;
  }
}

// Associate phone numbers with Voice Connector
async function associatePhoneNumbers(voiceConnectorId, phoneNumbers) {
  try {
    const params = {
      VoiceConnectorId: voiceConnectorId,
      E164PhoneNumbers: phoneNumbers
    };

    const result = await chimeSDKVoice.send(new AssociatePhoneNumbersWithVoiceConnectorCommand(params));
    return result.PhoneNumberErrors;
  } catch (error) {
    console.error('Error associating phone numbers:', error);
    throw error;
  }
}

// Disassociate phone numbers from Voice Connector
async function disassociatePhoneNumbers(voiceConnectorId, phoneNumbers) {
  try {
    const params = {
      VoiceConnectorId: voiceConnectorId,
      E164PhoneNumbers: phoneNumbers
    };

    const result = await chimeSDKVoice.send(new DisassociatePhoneNumbersFromVoiceConnectorCommand(params));
    return result.PhoneNumberErrors;
  } catch (error) {
    console.error('Error disassociating phone numbers:', error);
    throw error;
  }
}

// Create a SIP Media Application
async function createSipMediaApplication(name, endpoints) {
  try {
    const params = {
      Name: name,
      AwsRegion: 'us-east-1',
      Endpoints: endpoints
    };

    const result = await chimeSDKVoice.send(new CreateSipMediaApplicationCommand(params));
    return result.SipMediaApplication;
  } catch (error) {
    console.error('Error creating SIP Media Application:', error);
    throw error;
  }
}

// Create a SIP Rule
async function createSipRule(name, triggerType, triggerValue, targetApplications) {
  try {
    const params = {
      Name: name,
      TriggerType: triggerType,
      TriggerValue: triggerValue,
      TargetApplications: targetApplications
    };

    const result = await chimeSDKVoice.send(new CreateSipRuleCommand(params));
    return result.SipRule;
  } catch (error) {
    console.error('Error creating SIP Rule:', error);
    throw error;
  }
}

// Database operations for Voice Connectors
async function saveVoiceConnectorToDatabase(voiceConnector, userId) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO voice_connectors (
        name, chime_voice_connector_id, chime_voice_connector_arn, 
        region, encryption_enabled, streaming_enabled, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      voiceConnector.Name,
      voiceConnector.VoiceConnectorId,
      voiceConnector.VoiceConnectorArn,
      voiceConnector.AwsRegion,
      voiceConnector.RequireEncryption,
      voiceConnector.StreamingConfiguration?.Enabled || false,
      'active'
    ]);
    
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function savePhoneNumberToDatabase(phoneNumber, voiceConnectorId, countryCode, phoneNumberType) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO phone_numbers (
        voice_connector_id, phone_number, country_code, 
        phone_number_type, status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      voiceConnectorId,
      phoneNumber,
      countryCode,
      phoneNumberType,
      'active'
    ]);
    
    return result.rows[0];
  } finally {
    client.release();
  }
}

// Main handler
exports.handler = async (event) => {
  try {
    const user = await verifyToken(event);
    const path = event.path;
    const method = event.httpMethod;
    
    // Ensure user exists in database
    const client = await pool.connect();
    try {
      const userResult = await client.query(`
        SELECT * FROM users WHERE cognito_user_id = $1
      `, [user.cognito_user_id]);
      
      if (userResult.rows.length === 0) {
        // Create user if doesn't exist
        await client.query(`
          INSERT INTO users (cognito_user_id, email, first_name, last_name)
          VALUES ($1, $2, $3, $4)
        `, [user.cognito_user_id, user.email, '', '']);
      }
      
      const userId = userResult.rows[0]?.id || (await client.query(`
        SELECT id FROM users WHERE cognito_user_id = $1
      `, [user.cognito_user_id])).rows[0].id;
      
      let result;
      
      if (path === '/voice-connectors' && method === 'POST') {
        // Create Voice Connector
        const body = JSON.parse(event.body);
        const voiceConnector = await createVoiceConnector(body.name, body.region);
        result = await saveVoiceConnectorToDatabase(voiceConnector, userId);
      } else if (path === '/voice-connectors' && method === 'GET') {
        // List Voice Connectors
        result = await listVoiceConnectors();
      } else if (path.startsWith('/voice-connectors/') && path.endsWith('/phone-numbers') && method === 'POST') {
        // Associate phone numbers
        const voiceConnectorId = path.split('/')[2];
        const body = JSON.parse(event.body);
        result = await associatePhoneNumbers(voiceConnectorId, body.phone_numbers);
      } else if (path === '/phone-numbers/search' && method === 'GET') {
        // Search available phone numbers
        const countryCode = event.queryStringParameters?.country_code || 'US';
        const phoneNumberType = event.queryStringParameters?.phone_number_type || 'Local';
        result = await searchAvailablePhoneNumbers(countryCode, phoneNumberType);
      } else if (path === '/phone-numbers/order' && method === 'POST') {
        // Order phone numbers
        const body = JSON.parse(event.body);
        result = await orderPhoneNumbers(body.phone_numbers, body.voice_connector_id);
      } else if (path === '/sip-media-applications' && method === 'POST') {
        // Create SIP Media Application
        const body = JSON.parse(event.body);
        result = await createSipMediaApplication(body.name, body.endpoints);
      } else if (path === '/sip-rules' && method === 'POST') {
        // Create SIP Rule
        const body = JSON.parse(event.body);
        result = await createSipRule(body.name, body.trigger_type, body.trigger_value, body.target_applications);
      } else {
        throw new Error('Invalid endpoint');
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify(result)
      };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: error.message.includes('not found') ? 404 : 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
