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

// Get chat messages for a meeting
async function getChatMessages(meetingId, limit = 50) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT cm.*, u.first_name, u.last_name, u.email as sender_email
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_user_id = u.id
      WHERE cm.meeting_id = $1
      ORDER BY cm.created_at DESC
      LIMIT $2
    `, [meetingId, limit]);
    
    return result.rows.reverse(); // Return in chronological order
  } finally {
    client.release();
  }
}

// Send a chat message
async function sendChatMessage(meetingId, senderUserId, messageData) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO chat_messages (
        meeting_id, sender_user_id, message_type, content,
        file_url, file_name, file_size, is_private, recipient_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      meetingId,
      senderUserId,
      messageData.message_type || 'text',
      messageData.content,
      messageData.file_url || null,
      messageData.file_name || null,
      messageData.file_size || null,
      messageData.is_private || false,
      messageData.recipient_user_id || null
    ]);
    
    // Get sender details
    const senderResult = await client.query(`
      SELECT first_name, last_name, email FROM users WHERE id = $1
    `, [senderUserId]);
    
    const message = result.rows[0];
    message.sender_name = `${senderResult.rows[0]?.first_name || ''} ${senderResult.rows[0]?.last_name || ''}`.trim();
    message.sender_email = senderResult.rows[0]?.email;
    
    return message;
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
      
      if (path.startsWith('/meetings/') && path.endsWith('/chat') && method === 'GET') {
        // Get chat messages
        const meetingId = path.split('/')[2];
        const limit = event.queryStringParameters?.limit || 50;
        result = await getChatMessages(meetingId, limit);
      } else if (path.startsWith('/meetings/') && path.endsWith('/chat') && method === 'POST') {
        // Send chat message
        const meetingId = path.split('/')[2];
        const body = JSON.parse(event.body);
        result = await sendChatMessage(meetingId, userId, body);
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
