const { Pool } = require('pg');

// Database connection with exact same settings as Lambda
const pool = new Pool({
  host: 'video-conferencing-dev.cluster-clrcltlw1dlu.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'video_conferencing',
  user: 'dbadmin',
  password: 'VideoConf2025!',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000, // 30 seconds for wake-up
  idleTimeoutMillis: 30000,
  max: 10
});

async function wakeUpDatabase() {
  console.log('🔄 Attempting to wake up Aurora Serverless database...');
  console.log('📍 Host:', 'video-conferencing-dev.cluster-clrcltlw1dlu.us-east-1.rds.amazonaws.com');
  console.log('💾 Database:', 'video_conferencing');
  
  try {
    console.log('⏳ Connecting to database (this may take 10-30 seconds for cold start)...');
    const startTime = Date.now();
    
    const client = await pool.connect();
    const connectTime = Date.now() - startTime;
    console.log(`✅ Database connection successful! (took ${connectTime}ms)`);
    
    // Test basic query
    console.log('🔍 Testing basic query...');
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Query successful!');
    console.log('🕐 Current time:', result.rows[0].current_time);
    console.log('📝 Database version:', result.rows[0].db_version);
    
    // Check if tables exist
    console.log('🔍 Checking table structure...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      console.log('✅ Tables found:');
      tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
      
      // Check users table
      const userCount = await client.query('SELECT COUNT(*) as count FROM users');
      console.log(`👥 Users in database: ${userCount.rows[0].count}`);
      
      // Check meetings table
      const meetingCount = await client.query('SELECT COUNT(*) as count FROM meetings');
      console.log(`📅 Meetings in database: ${meetingCount.rows[0].count}`);
      
    } else {
      console.log('⚠️  No tables found - database might need schema initialization');
    }
    
    client.release();
    console.log('✅ Database is now awake and ready for connections!');
    console.log('🚀 You can now test the real database integration.');
    
  } catch (error) {
    console.error('❌ Database wake-up failed:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('💡 This might be normal for Aurora Serverless cold start. Try again in a moment.');
    } else if (error.message.includes('authentication')) {
      console.log('🔐 Check database credentials and user permissions.');
    } else if (error.message.includes('could not connect')) {
      console.log('🌐 Check network connectivity and security groups.');
    }
    
    console.error('📋 Full error details:', error);
  } finally {
    await pool.end();
  }
}

// Run the wake-up process
wakeUpDatabase().then(() => {
  console.log('🏁 Wake-up process completed.');
}).catch(err => {
  console.error('💥 Unexpected error:', err);
  process.exit(1);
});
