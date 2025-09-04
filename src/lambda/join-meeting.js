const { ChimeSDKMeetingsClient, CreateAttendeeCommand } = require('@aws-sdk/client-chime-sdk-meetings');
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

    const result = await chimeSDKMeetings.send(new CreateAttendeeCommand(params));
    return result.Attendee;
  } catch (error) {
    console.error('Error creating ChimeSDK attendee:', error);
    throw error;
  }
}

// Join meeting
async function joinMeeting(userId, meetingCode, password) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Find meeting by code
    const meetingResult = await client.query(`
      SELECT * FROM meetings WHERE meeting_code = $1 AND status = 'active'
    `, [meetingCode]);
    
    if (meetingResult.rows.length === 0) {
      throw new Error('Meeting not found or inactive');
    }
    
    const meeting = meetingResult.rows[0];
    
    // Check password if required
    if (meeting.password_protected && meeting.meeting_password !== password) {
      throw new Error('Invalid meeting password');
    }
    
    // Check if user is already a participant
    const existingParticipant = await client.query(`
      SELECT * FROM meeting_participants 
      WHERE meeting_id = $1 AND user_id = $2 AND is_active = true
    `, [meeting.id, userId]);
    
    if (existingParticipant.rows.length > 0) {
      // User is already in the meeting
      return {
        meeting,
        attendee: existingParticipant.rows[0]
      };
    }
    
    // Create ChimeSDK attendee
    const chimeAttendee = await createChimeAttendee(
      meeting.chime_meeting_id,
      userId,
      password
    );
    
    // Add user as participant
    const participantResult = await client.query(`
      INSERT INTO meeting_participants (
        meeting_id, user_id, chime_attendee_id, joined_at, is_active
      ) VALUES ($1, $2, $3, NOW(), true)
      RETURNING *
    `, [meeting.id, userId, chimeAttendee.AttendeeId]);
    
    await client.query('COMMIT');
    
    return {
      meeting,
      attendee: participantResult.rows[0],
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
  try {
    const user = await verifyToken(event);
    
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
      const result = await joinMeeting(userId, body.meeting_code, body.password);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'http://localhost:3000',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
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
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
