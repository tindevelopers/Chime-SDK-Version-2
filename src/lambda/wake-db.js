const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 60000, // 60 seconds for wake-up
  idleTimeoutMillis: 30000,
  max: 5
});

exports.handler = async (event) => {
  console.log('🔄 Lambda: Attempting to wake up database...');
  
  try {
    const startTime = Date.now();
    console.log('⏳ Connecting to database...');
    
    const client = await pool.connect();
    const connectTime = Date.now() - startTime;
    console.log(`✅ Database connection successful! (took ${connectTime}ms)`);
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Query successful!');
    console.log('🕐 Current time:', result.rows[0].current_time);
    
    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📊 Found ${tables.rows.length} tables`);
    
    client.release();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Database is awake and responsive',
        connectionTime: connectTime,
        currentTime: result.rows[0].current_time,
        tableCount: tables.rows.length
      })
    };
    
  } catch (error) {
    console.error('❌ Database wake-up failed:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Database wake-up failed'
      })
    };
  }
};
