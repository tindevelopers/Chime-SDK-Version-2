const { Pool } = require('pg');

// Database connection pool
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
    // Decode the JWT token (this is a simplified version - in production you should verify the signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Extract user information from Cognito token
    return {
      cognito_user_id: payload.sub,
      email: payload.email || payload['cognito:username'] || 'unknown@example.com'
    };
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Invalid token');
  }
}

// Helper function to ensure user exists in database
async function ensureUser(user) {
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
    
    return userId;
  } finally {
    client.release();
  }
}

// Standard CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

// Helper function to create standard response
function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body)
  };
}

// Helper function to create error response
function createErrorResponse(error) {
  const statusCode = error.message.includes('not found') ? 404 : 400;
  return createResponse(statusCode, { error: error.message });
}

module.exports = {
  pool,
  verifyToken,
  ensureUser,
  corsHeaders,
  createResponse,
  createErrorResponse
};
