const { ChimeSDKMeetingsClient, CreateMeetingCommand, CreateAttendeeCommand } = require('@aws-sdk/client-chime-sdk-meetings');
const { Pool } = require('pg');

// Initialize ChimeSDK client
const chimeSDKMeetings = new ChimeSDKMeetingsClient({ region: 'us-east-1' });

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

// Helper function to verify JWT token
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

// Create a ChimeSDK meeting
async function createChimeMeeting(meetingData) {
  try {
    const params = {
      ClientRequestToken: `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      MediaRegion: 'us-east-1',
      ExternalMeetingId: meetingData.meeting_code || `meeting-${Date.now()}`,
      MeetingFeatures: {
        Audio: {
          EchoReduction: 'AVAILABLE'
        },
        Video: {
          MaxResolution: 'HD'
        },
        Content: {
          MaxResolution: 'FHD'
        }
      },
      NotificationsConfiguration: {
        SnsTopicArn: process.env.SNS_TOPIC_ARN,
        SqsQueueArn: process.env.SQS_QUEUE_ARN
      }
    };

    const command = new CreateMeetingCommand(params);
    const result = await chimeSDKMeetings.send(command);
    return result.Meeting;
  } catch (error) {
    console.error('Error creating ChimeSDK meeting:', error);
    throw error;
  }
}

// Create an attendee for a meeting
async function createChimeAttendee(meetingId, userId, userEmail) {
  try {
    const params = {
      MeetingId: meetingId,
      ExternalUserId: userId,
      Capabilities: {
        Audio: 'SendReceive',
        Video: 'SendReceive',
        Content: 'SendReceive'
      }
    };

    const command = new CreateAttendeeCommand(params);
    const result = await chimeSDKMeetings.send(command);
    return result.Attendee;
  } catch (error) {
    console.error('Error creating ChimeSDK attendee:', error);
    throw error;
  }
}

// Create meeting in database and ChimeSDK
async function createMeeting(userId, meetingData) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Generate meeting code if not provided
    const meetingCode = meetingData.meeting_code || `MEET-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Create ChimeSDK meeting
    const chimeMeeting = await createChimeMeeting({
      ...meetingData,
      meeting_code: meetingCode
    });
    
    // Insert meeting into database
    const meetingResult = await client.query(`
      INSERT INTO meetings (
        title, description, meeting_code, max_participants, 
        recording_enabled, chat_enabled, screen_sharing_enabled,
        waiting_room_enabled, password_protected, meeting_password,
        chime_meeting_id, created_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      meetingData.title,
      meetingData.description || '',
      meetingCode,
      meetingData.max_participants || 10,
      meetingData.recording_enabled || false,
      meetingData.chat_enabled || true,
      meetingData.screen_sharing_enabled || true,
      meetingData.waiting_room_enabled || false,
      meetingData.password_protected || false,
      meetingData.meeting_password || null,
      chimeMeeting.MeetingId,
      userId,
      'active'
    ]);
    
    const meeting = meetingResult.rows[0];
    
    // Create attendee for the meeting creator
    const chimeAttendee = await createChimeAttendee(
      chimeMeeting.MeetingId,
      userId,
      meetingData.email
    );
    
    // Add creator as participant
    await client.query(`
      INSERT INTO meeting_participants (
        meeting_id, user_id, chime_attendee_id, joined_at, is_active
      ) VALUES ($1, $2, $3, NOW(), true)
    `, [meeting.id, userId, chimeAttendee.AttendeeId]);
    
    await client.query('COMMIT');
    
    return {
      ...meeting,
      chime_meeting: chimeMeeting,
      chime_attendee: chimeAttendee
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Main handler
exports.handler = async (event) => {
  // Handle OPTIONS requests (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: ''
    };
  }

  try {
    const user = await verifyToken(event);
    console.log('User authenticated:', user);
    
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
      
      const body = JSON.parse(event.body);
      console.log('Creating meeting with data:', body);
      
      const result = await createMeeting(userId, body);
      console.log('Meeting created successfully:', result);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'http://localhost:3000',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Credentials': 'true'
        },
        body: JSON.stringify(result)
      };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error creating meeting:', error);
    
    return {
      statusCode: error.message.includes('not found') ? 404 : 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
