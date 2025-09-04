const { Pool } = require('pg');

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

// Get user's meetings
async function getUserMeetings(userId) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        m.*,
        COUNT(mp.id) as participant_count
      FROM meetings m
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id AND mp.is_active = true
      WHERE m.created_by = $1
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `, [userId]);
    
    return result.rows;
  } finally {
    client.release();
  }
}

// Get meeting details by ID
async function getMeetingById(meetingId) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        m.*,
        u.email as creator_email,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name,
        COUNT(mp.id) as participant_count
      FROM meetings m
      LEFT JOIN users u ON m.created_by = u.id
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id AND mp.is_active = true
      WHERE m.id = $1
      GROUP BY m.id, u.email, u.first_name, u.last_name
    `, [meetingId]);
    
    if (result.rows.length === 0) {
      throw new Error('Meeting not found');
    }
    
    return result.rows[0];
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
    
    // Check if this is a request for a specific meeting
    // Since the new route might not be deployed, check both pathParameters and queryStringParameters
    const meetingId = event.pathParameters?.meetingId || event.queryStringParameters?.meetingId;
    
    if (meetingId) {
      // Get specific meeting details
      console.log('Fetching meeting details for ID:', meetingId);
      
      const meeting = await getMeetingById(meetingId);
      console.log('Meeting details retrieved:', meeting);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'http://localhost:3000',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Credentials': 'true'
        },
        body: JSON.stringify(meeting)
      };
    }
    
    // Get all meetings for user
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
      
      const result = await getUserMeetings(userId);
      console.log('Retrieved meetings for user:', result);
      
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
    console.error('Error:', error);
    
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
