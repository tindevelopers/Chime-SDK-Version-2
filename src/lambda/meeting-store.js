// In-memory meeting storage - shared across Lambda functions
// This is a temporary solution until database connectivity is resolved

class MeetingStore {
  constructor() {
    this.meetings = new Map();
    this.userMeetings = new Map(); // Map user IDs to meeting IDs
  }

  // Store a meeting
  storeMeeting(meeting) {
    // Store by multiple keys for easy lookup
    this.meetings.set(meeting.id, meeting);
    this.meetings.set(meeting.chime_meeting_id, meeting);
    this.meetings.set(meeting.meeting_code, meeting);
    
    // Track user meetings
    const userId = meeting.created_by;
    if (!this.userMeetings.has(userId)) {
      this.userMeetings.set(userId, new Set());
    }
    this.userMeetings.get(userId).add(meeting.id);
    
    console.log(`✅ Stored meeting: ${meeting.id} (Code: ${meeting.meeting_code})`);
    console.log(`📊 Total meetings stored: ${this.meetings.size / 3}`); // Divided by 3 because we store each meeting 3 times
  }

  // Get meeting by any identifier
  getMeeting(identifier) {
    const meeting = this.meetings.get(identifier);
    if (meeting) {
      console.log(`✅ Found meeting: ${meeting.title} (${meeting.meeting_code})`);
    } else {
      console.log(`❌ Meeting not found: ${identifier}`);
    }
    return meeting;
  }

  // Get all meetings for a user
  getUserMeetings(userId) {
    const meetingIds = this.userMeetings.get(userId) || new Set();
    const meetings = Array.from(meetingIds)
      .map(id => this.meetings.get(id))
      .filter(meeting => meeting !== undefined)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    console.log(`📋 Found ${meetings.length} meetings for user ${userId}`);
    return meetings;
  }

  // Get all meetings (for debugging)
  getAllMeetings() {
    const uniqueMeetings = new Map();
    for (const [key, meeting] of this.meetings) {
      uniqueMeetings.set(meeting.id, meeting);
    }
    return Array.from(uniqueMeetings.values());
  }

  // Clear all meetings (for testing)
  clear() {
    this.meetings.clear();
    this.userMeetings.clear();
    console.log('🧹 Cleared all meetings from store');
  }
}

// Export singleton instance
module.exports = new MeetingStore();
