const { ChimeSDKMediaPipelinesClient, CreateMediaCapturePipelineCommand, StopMediaCapturePipelineCommand, GetMediaCapturePipelineCommand } = require('@aws-sdk/client-chime-sdk-media-pipelines');
const { Pool } = require('pg');

// Initialize ChimeSDK Media Pipelines client
const chimeSDKMediaPipelines = new ChimeSDKMediaPipelinesClient({ region: 'us-east-1' });

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

// Start recording a meeting
async function startRecording(meetingId, recordingType = 'video') {
  const client = await pool.connect();
  try {
    // Get meeting details
    const meetingResult = await client.query(`
      SELECT chime_meeting_id FROM meetings WHERE id = $1
    `, [meetingId]);
    
    if (meetingResult.rows.length === 0) {
      throw new Error('Meeting not found');
    }
    
    const chimeMeetingId = meetingResult.rows[0].chime_meeting_id;
    
    // Create media pipeline for recording
    const pipelineParams = {
      MediaPipelineType: 'MediaCapturePipeline',
      MediaCapturePipeline: {
        MediaPipelineArn: `arn:aws:chime:us-east-1:${process.env.AWS_ACCOUNT_ID}:media-pipeline/${chimeMeetingId}`,
        SourceType: 'ChimeSdkMeeting',
        SourceArn: `arn:aws:chime:us-east-1:${process.env.AWS_ACCOUNT_ID}:meeting/${chimeMeetingId}`,
        ChimeSdkMeetingConfiguration: {
          SourceConfiguration: {
            SelectedVideoStreams: {
              AttendeeIds: ['*'],
              ExternalUserIds: ['*']
            }
          },
          ArtifactsConfiguration: {
            Audio: {
              MuxType: 'AudioOnly'
            },
            Video: {
              State: 'Enabled',
              MuxType: 'VideoOnly'
            },
            Content: {
              State: 'Enabled',
              MuxType: 'ContentOnly'
            },
            DataChannel: {
              State: 'Enabled',
              MuxType: 'DataChannelOnly'
            }
          }
        },
        SinkType: 'S3Bucket',
        SinkArn: `arn:aws:s3:::${process.env.RECORDINGS_BUCKET_NAME}`
      }
    };
    
    const pipelineResult = await chimeSDKMediaPipelines.createMediaCapturePipeline(pipelineParams).promise();
    const mediaPipeline = pipelineResult.MediaCapturePipeline;
    
    // Save recording to database
    const recordingResult = await client.query(`
      INSERT INTO recordings (
        meeting_id, recording_type, s3_bucket, s3_key, status,
        chime_media_pipeline_id, chime_recording_arn
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      meetingId,
      recordingType,
      process.env.RECORDINGS_BUCKET_NAME,
      `recordings/${meetingId}/${Date.now()}`,
      'processing',
      mediaPipeline.MediaPipelineId,
      mediaPipeline.MediaPipelineArn
    ]);
    
    return {
      ...recordingResult.rows[0],
      media_pipeline: mediaPipeline
    };
  } finally {
    client.release();
  }
}

// Stop recording a meeting
async function stopRecording(meetingId) {
  const client = await pool.connect();
  try {
    // Get recording details
    const recordingResult = await client.query(`
      SELECT * FROM recordings 
      WHERE meeting_id = $1 AND status = 'processing'
      ORDER BY created_at DESC
      LIMIT 1
    `, [meetingId]);
    
    if (recordingResult.rows.length === 0) {
      throw new Error('No active recording found for this meeting');
    }
    
    const recording = recordingResult.rows[0];
    
    // Stop the media pipeline
    const stopParams = {
      MediaPipelineId: recording.chime_media_pipeline_id
    };
    
    await chimeSDKMediaPipelines.deleteMediaCapturePipeline(stopParams).promise();
    
    // Update recording status
    await client.query(`
      UPDATE recordings 
      SET status = 'completed', completed_at = NOW()
      WHERE id = $1
    `, [recording.id]);
    
    return { success: true, recording_id: recording.id };
  } finally {
    client.release();
  }
}

// Get recordings for a meeting
async function getRecordings(meetingId) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM recordings 
      WHERE meeting_id = $1
      ORDER BY created_at DESC
    `, [meetingId]);
    
    return result.rows;
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
      
      if (path.startsWith('/meetings/') && path.endsWith('/recordings') && method === 'GET') {
        // Get recordings
        const meetingId = path.split('/')[2];
        result = await getRecordings(meetingId);
      } else if (path.startsWith('/meetings/') && path.endsWith('/recordings/start') && method === 'POST') {
        // Start recording
        const meetingId = path.split('/')[2];
        const body = JSON.parse(event.body || '{}');
        result = await startRecording(meetingId, body.recording_type);
      } else if (path.startsWith('/meetings/') && path.endsWith('/recordings/stop') && method === 'POST') {
        // Stop recording
        const meetingId = path.split('/')[2];
        result = await stopRecording(meetingId);
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
