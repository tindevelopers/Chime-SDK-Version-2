import { Tool } from "@modelcontextprotocol/sdk/server/index.js";
import { ChimeSDKClient } from "../client.js";
import { z } from "zod";

const JoinMeetingSchema = z.object({
  meetingId: z.string().describe("Meeting ID to join"),
  attendeeName: z.string().describe("Name of the attendee joining"),
});

export class JoinMeetingTool extends Tool {
  constructor(private chimeClient: ChimeSDKClient) {
    super({
      name: "join_meeting",
      description: "Join an existing meeting as an attendee",
      inputSchema: JoinMeetingSchema,
    });
  }

  async execute(input: z.infer<typeof JoinMeetingSchema>): Promise<string> {
    try {
      const attendee = await this.chimeClient.joinMeeting(input.meetingId, input.attendeeName);
      
      return `Successfully joined meeting ${input.meetingId}:
- Attendee ID: ${attendee.attendeeId}
- Name: ${attendee.name}
- Is Host: ${attendee.isHost ? 'Yes' : 'No'}
- Audio: ${attendee.isMuted ? 'Muted' : 'Unmuted'}
- Video: ${attendee.hasVideo ? 'On' : 'Off'}`;
    } catch (error) {
      return `Error joining meeting: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
