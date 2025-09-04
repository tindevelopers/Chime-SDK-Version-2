const AWS = require('aws-sdk');

// Initialize ChimeSDK clients
const chimeSDKMeetings = new AWS.ChimeSDKMeetings({ region: 'us-east-1' });
const chimeSDKVoice = new AWS.ChimeSDKVoice({ region: 'us-east-1' });

async function testChimeSDKIntegration() {
  console.log('🧪 Testing ChimeSDK Integration...\n');

  try {
    // Test 1: Create a meeting
    console.log('1. Creating a test meeting...');
    const meetingParams = {
      ClientRequestToken: `test-meeting-${Date.now()}`,
      MediaRegion: 'us-east-1',
      ExternalMeetingId: `test-meeting-${Date.now()}`,
      MeetingFeatures: {
        Audio: {
          EchoReduction: 'AVAILABLE'
        },
        Video: {
          MaxResolution: 'HD'
        },
        Content: {
          MaxResolution: 'FHD'
        }
      }
    };

    const meetingResult = await chimeSDKMeetings.createMeeting(meetingParams).promise();
    const meeting = meetingResult.Meeting;
    console.log('✅ Meeting created successfully!');
    console.log(`   Meeting ID: ${meeting.MeetingId}`);
    console.log(`   External Meeting ID: ${meeting.ExternalMeetingId}`);
    console.log(`   Media Region: ${meeting.MediaRegion}\n`);

    // Test 2: Create an attendee
    console.log('2. Creating a test attendee...');
    const attendeeParams = {
      MeetingId: meeting.MeetingId,
      ExternalUserId: 'test-user-001',
      Capabilities: {
        Audio: 'SendReceive',
        Video: 'SendReceive',
        Content: 'SendReceive'
      }
    };

    const attendeeResult = await chimeSDKMeetings.createAttendee(attendeeParams).promise();
    const attendee = attendeeResult.Attendee;
    console.log('✅ Attendee created successfully!');
    console.log(`   Attendee ID: ${attendee.AttendeeId}`);
    console.log(`   External User ID: ${attendee.ExternalUserId}`);
    console.log(`   Join Token: ${attendee.JoinToken.substring(0, 20)}...\n`);

    // Test 3: Get meeting details
    console.log('3. Getting meeting details...');
    const getMeetingParams = {
      MeetingId: meeting.MeetingId
    };

    const getMeetingResult = await chimeSDKMeetings.getMeeting(getMeetingParams).promise();
    console.log('✅ Meeting details retrieved successfully!');
    console.log(`   Meeting ARN: ${getMeetingResult.Meeting.MeetingArn}`);
    console.log(`   Audio Host URL: ${getMeetingResult.Meeting.MediaPlacement.AudioHostUrl}\n`);

    // Test 4: List attendees
    console.log('4. Listing attendees...');
    const listAttendeesParams = {
      MeetingId: meeting.MeetingId
    };

    const listAttendeesResult = await chimeSDKMeetings.listAttendees(listAttendeesParams).promise();
    console.log('✅ Attendees listed successfully!');
    console.log(`   Number of attendees: ${listAttendeesResult.Attendees.length}\n`);

    // Test 5: Search available phone numbers
    console.log('5. Searching available phone numbers...');
    const searchPhoneParams = {
      CountryCode: 'US',
      PhoneNumberType: 'Local',
      MaxResults: 5
    };

    const searchPhoneResult = await chimeSDKVoice.searchAvailablePhoneNumbers(searchPhoneParams).promise();
    console.log('✅ Phone number search completed!');
    console.log(`   Available numbers: ${searchPhoneResult.E164PhoneNumbers.length}\n`);

    // Test 6: Clean up - Delete meeting
    console.log('6. Cleaning up - Deleting test meeting...');
    const deleteMeetingParams = {
      MeetingId: meeting.MeetingId
    };

    await chimeSDKMeetings.deleteMeeting(deleteMeetingParams).promise();
    console.log('✅ Test meeting deleted successfully!\n');

    console.log('🎉 All ChimeSDK integration tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Meeting creation');
    console.log('   ✅ Attendee creation');
    console.log('   ✅ Meeting details retrieval');
    console.log('   ✅ Attendee listing');
    console.log('   ✅ Phone number search');
    console.log('   ✅ Meeting cleanup');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the test
testChimeSDKIntegration();
