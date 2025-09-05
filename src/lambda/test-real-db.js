const dbManager = require('./utils/database');

exports.handler = async (event) => {
  console.log('🔄 Starting database test...');
  
  try {
    // Step 1: Check if database responds to simple query
    console.log('📊 Step 1: Testing basic connectivity...');
    const startTime = Date.now();
    
    const result = await dbManager.executeQuery('SELECT NOW() as current_time, version() as db_version');
    const connectTime = Date.now() - startTime;
    
    console.log(`✅ Database connected successfully! (${connectTime}ms)`);
    console.log('🕐 Current time:', result.rows[0].current_time);
    console.log('📝 Database version:', result.rows[0].db_version);
    
    // Step 2: Check tables
    console.log('📊 Step 2: Checking table structure...');
    const tables = await dbManager.executeQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`✅ Found ${tables.rows.length} tables:`, tables.rows.map(r => r.table_name));
    
    // Step 3: Check users table specifically
    const userCount = await dbManager.executeQuery('SELECT COUNT(*) as count FROM users');
    console.log(`👥 Users in database: ${userCount.rows[0].count}`);
    
    // Step 4: Check meetings table
    const meetingCount = await dbManager.executeQuery('SELECT COUNT(*) as count FROM meetings');
    console.log(`📅 Meetings in database: ${meetingCount.rows[0].count}`);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Database test successful',
        connectionTime: connectTime,
        currentTime: result.rows[0].current_time,
        dbVersion: result.rows[0].db_version,
        tableCount: tables.rows.length,
        userCount: userCount.rows[0].count,
        meetingCount: meetingCount.rows[0].count,
        tables: tables.rows.map(r => r.table_name)
      })
    };
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Database test failed'
      })
    };
  }
};
