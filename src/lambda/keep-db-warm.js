const { Pool } = require('pg');

// Simple connection for warming
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
  max: 1 // Only need 1 connection for warming
});

exports.handler = async (event) => {
  console.log('🔥 Database warming scheduled function started');
  
  try {
    const client = await pool.connect();
    
    // Simple query to keep database active
    const result = await client.query('SELECT NOW() as warm_time, COUNT(*) as meeting_count FROM meetings');
    
    client.release();
    
    console.log('✅ Database warmed successfully at:', result.rows[0].warm_time);
    console.log('📊 Current meetings in database:', result.rows[0].meeting_count);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Database warmed successfully',
        warmTime: result.rows[0].warm_time,
        meetingCount: result.rows[0].meeting_count
      })
    };
    
  } catch (error) {
    console.error('❌ Database warming failed:', error.message);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Database warming failed'
      })
    };
  }
};
