const { Pool } = require('pg');

// Database connection with exact same settings as Lambda
const pool = new Pool({
  host: 'video-conferencing-dev.cluster-clrcltlw1dlu.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'video_conferencing',
  user: 'dbadmin',
  password: 'VideoConf2025!',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query successful:', result.rows[0]);
    
    // Test users table
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log('✅ Users table accessible, count:', userCount.rows[0].count);
    
    client.release();
    console.log('✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

testConnection();
