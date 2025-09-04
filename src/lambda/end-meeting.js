const { ChimeSDKMeetingsClient, DeleteMeetingCommand } = require('@aws-sdk/client-chime-sdk-meetings');
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

// End meeting
async function endMeeting(userId, meetingId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if user is the meeting creator
    const meetingResult = await client.query(`
      SELECT * FROM meetings WHERE id = $1 AND created_by = $2
    `, [meetingId, userId]);
    
    if (meetingResult.rows.length === 0) {
      throw new Error('Meeting not found or you are not the creator');
    }
    
    const meeting = meetingResult.rows[0];
    
    // Delete ChimeSDK meeting
    try {
      await chimeSDKMeetings.send(new DeleteMeetingCommand({
        MeetingId: meeting.chime_meeting_id
      }));
    } catch (error) {
      console.error('Error deleting ChimeSDK meeting:', error);
      // Continue even if ChimeSDK deletion fails
    }
    
    // Update meeting status to ended
    await client.query(`
      UPDATE meetings 
      SET status = 'ended', ended_at = NOW()
      WHERE id = $1
    `, [meetingId]);
    
    // Mark all participants as inactive
    await client.query(`
      UPDATE meeting_participants 
      SET left_at = NOW(), is_active = false
      WHERE meeting_id = $1
    `, [meetingId]);
    
    await client.query('COMMIT');
    return { success: true };
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
      
      // Extract meeting ID from path
      const meetingId = event.path.split('/')[2];
      const result = await endMeeting(userId, meetingId);
      
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
