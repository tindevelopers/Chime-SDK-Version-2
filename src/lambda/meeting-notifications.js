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

// Process meeting notifications from SQS
async function processMeetingNotification(notification) {
  const client = await pool.connect();
  try {
    console.log('Processing meeting notification:', JSON.stringify(notification, null, 2));
    
    // Extract meeting information from notification
    const { meetingId, eventType, timestamp, attendeeId } = notification;
    
    // Log the notification to analytics
    await client.query(`
      INSERT INTO meeting_analytics (
        meeting_id, metric_name, metric_value, metric_unit, metadata
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      meetingId,
      eventType,
      1,
      'count',
      JSON.stringify({
        attendee_id: attendeeId,
        timestamp: timestamp,
        notification: notification
      })
    ]);
    
    console.log(`Processed ${eventType} event for meeting ${meetingId}`);
    
  } catch (error) {
    console.error('Error processing meeting notification:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main handler for SQS events
exports.handler = async (event) => {
  console.log('Received SQS event:', JSON.stringify(event, null, 2));
  
  const results = [];
  
  for (const record of event.Records) {
    try {
      // Parse the SQS message body
      const body = JSON.parse(record.body);
      const notification = JSON.parse(body.Message);
      
      // Process the notification
      await processMeetingNotification(notification);
      
      results.push({
        messageId: record.messageId,
        status: 'success'
      });
      
    } catch (error) {
      console.error('Error processing record:', record.messageId, error);
      results.push({
        messageId: record.messageId,
        status: 'error',
        error: error.message
      });
    }
  }
  
  console.log('Processing results:', results);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      processedRecords: results.length,
      results: results
    })
  };
};
