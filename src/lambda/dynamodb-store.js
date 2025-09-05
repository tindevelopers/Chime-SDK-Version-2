const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ddbDocClient = DynamoDBDocumentClient.from(client);

const MEETINGS_TABLE = 'video-conferencing-meetings';

class DynamoDBMeetingStore {
  async storeMeeting(meeting) {
    try {
      // Store main meeting record
      await ddbDocClient.send(new PutCommand({
        TableName: MEETINGS_TABLE,
        Item: {
          pk: `MEETING#${meeting.id}`,
          sk: 'MEETING',
          id: meeting.id,
          chime_meeting_id: meeting.chime_meeting_id,
          meeting_code: meeting.meeting_code,
          created_by: meeting.created_by,
          ...meeting,
          ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours TTL
        }
      }));

      // Store by meeting code for easy lookup
      await ddbDocClient.send(new PutCommand({
        TableName: MEETINGS_TABLE,
        Item: {
          pk: `CODE#${meeting.meeting_code}`,
          sk: 'MEETING',
          meeting_id: meeting.id,
          ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        }
      }));

      // Store by chime meeting ID for easy lookup
      await ddbDocClient.send(new PutCommand({
        TableName: MEETINGS_TABLE,
        Item: {
          pk: `CHIME#${meeting.chime_meeting_id}`,
          sk: 'MEETING',
          meeting_id: meeting.id,
          ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        }
      }));

      // Store user-meeting mapping
      await ddbDocClient.send(new PutCommand({
        TableName: MEETINGS_TABLE,
        Item: {
          pk: `USER#${meeting.created_by}`,
          sk: `MEETING#${meeting.id}`,
          meeting_id: meeting.id,
          created_at: meeting.created_at,
          ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        }
      }));

      console.log(`✅ Stored meeting in DynamoDB: ${meeting.id} (Code: ${meeting.meeting_code})`);
      return true;
    } catch (error) {
      console.error('❌ Error storing meeting in DynamoDB:', error);
      return false;
    }
  }

  async getMeeting(identifier) {
    try {
      // Try to get by direct meeting ID first
      if (identifier.startsWith('meeting-')) {
        const result = await ddbDocClient.send(new GetCommand({
          TableName: MEETINGS_TABLE,
          Key: {
            pk: `MEETING#${identifier}`,
            sk: 'MEETING'
          }
        }));
        
        if (result.Item) {
          console.log(`✅ Found meeting by ID: ${result.Item.title} (${result.Item.meeting_code})`);
          return result.Item;
        }
      }

      // Try to get by meeting code
      if (identifier.startsWith('MEET-')) {
        const result = await ddbDocClient.send(new GetCommand({
          TableName: MEETINGS_TABLE,
          Key: {
            pk: `CODE#${identifier}`,
            sk: 'MEETING'
          }
        }));
        
        if (result.Item) {
          // Get the actual meeting record
          return await this.getMeeting(result.Item.meeting_id);
        }
      }

      // Try to get by chime meeting ID (UUID format)
      if (identifier.includes('-') && identifier.length === 36) {
        const result = await ddbDocClient.send(new GetCommand({
          TableName: MEETINGS_TABLE,
          Key: {
            pk: `CHIME#${identifier}`,
            sk: 'MEETING'
          }
        }));
        
        if (result.Item) {
          // Get the actual meeting record
          return await this.getMeeting(result.Item.meeting_id);
        }
      }

      console.log(`❌ Meeting not found: ${identifier}`);
      return null;
    } catch (error) {
      console.error('❌ Error fetching meeting from DynamoDB:', error);
      return null;
    }
  }

  async getUserMeetings(userId) {
    try {
      const result = await ddbDocClient.send(new QueryCommand({
        TableName: MEETINGS_TABLE,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'MEETING#'
        },
        ScanIndexForward: false // Most recent first
      }));

      // Get full meeting details for each meeting
      const meetings = [];
      for (const item of result.Items) {
        const meeting = await this.getMeeting(item.meeting_id);
        if (meeting) {
          meetings.push(meeting);
        }
      }

      console.log(`📋 Found ${meetings.length} meetings for user ${userId}`);
      return meetings;
    } catch (error) {
      console.error('❌ Error fetching user meetings from DynamoDB:', error);
      return [];
    }
  }
}

module.exports = new DynamoDBMeetingStore();
