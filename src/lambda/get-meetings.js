const { ChimeSDKMeetingsClient, CreateAttendeeCommand } = require('@aws-sdk/client-chime-sdk-meetings');
const dynamoStore = require('./dynamodb-store');

// Initialize ChimeSDK client
const chimeSDKMeetings = new ChimeSDKMeetingsClient({ region: 'us-east-1' });

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

// Create a NEW attendee for a user joining an existing meeting
async function createChimeAttendee(meetingId, userId, userEmail) {
  try {
    const params = {
      MeetingId: meetingId,
      ExternalUserId: userId, // This makes each attendee unique per user
      Capabilities: {
        Audio: 'SendReceive',
        Video: 'SendReceive',
        Content: 'SendReceive'
      }
    };

    console.log('🔄 Creating NEW ChimeSDK attendee for user:', userId);
    const command = new CreateAttendeeCommand(params);
    const result = await chimeSDKMeetings.send(command);
    console.log('✅ NEW ChimeSDK attendee created:', result.Attendee.AttendeeId);
    return result.Attendee;
  } catch (error) {
    console.error('❌ Error creating ChimeSDK attendee:', error);
    throw error;
  }
}

// Get user's meetings from DynamoDB
async function getUserMeetings(userId) {
  return await dynamoStore.getUserMeetings(userId);
}

// Get meeting details by ID from DynamoDB
async function getMeetingById(meetingId) {
  const meeting = await dynamoStore.getMeeting(meetingId);
  if (!meeting) {
    throw new Error('Meeting not found');
  }
  return meeting;
}

// Main handler
exports.handler = async (event) => {
  // Handle OPTIONS requests (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
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
    const meetingId = event.pathParameters?.id || event.pathParameters?.meetingId || event.queryStringParameters?.meetingId;
    
    if (meetingId) {
      // Get specific meeting details from in-memory store
      console.log('Fetching meeting details for ID:', meetingId);
      
      const meeting = await getMeetingById(meetingId);
      console.log('✅ Meeting details retrieved from store:', meeting.id);
      
      // CRITICAL FIX: Create a NEW attendee for this user joining the meeting
      // Don't reuse the creator's attendee data
      console.log('🔄 Creating NEW attendee for user joining meeting...');
      
      let newAttendee;
      try {
        newAttendee = await createChimeAttendee(
          meeting.chime_meeting_id,
          user.cognito_user_id,
          user.email
        );
        console.log('✅ NEW attendee created for user:', user.cognito_user_id);
      } catch (attendeeError) {
        console.error('❌ Failed to create new attendee:', attendeeError);
        throw new Error(`Failed to join meeting: ${attendeeError.message}`);
      }
      
      // Return meeting data with the NEW attendee (not the creator's attendee)
      const meetingDataForUser = {
        ...meeting,
        // Replace the creator's attendee with the new attendee for this user
        chime_attendee: newAttendee,
        // Keep the original meeting data but provide fresh attendee data
        participant_role: meeting.created_by === user.cognito_user_id ? 'creator' : 'participant'
      };
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Credentials': 'true'
        },
        body: JSON.stringify({
          ...meetingDataForUser,
          source: 'dynamodb-with-new-attendee',
          success: true,
          message: 'Meeting details with fresh attendee credentials - ready to join!'
        })
      };
    }
    
    // Get all meetings for user from in-memory store
    const meetings = await getUserMeetings(user.cognito_user_id);
    console.log(`✅ Retrieved ${meetings.length} meetings from store for user:`, user.cognito_user_id);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify({
        meetings: meetings,
        source: 'dynamodb',
        success: true,
        count: meetings.length
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: error.message.includes('not found') ? 404 : 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
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
