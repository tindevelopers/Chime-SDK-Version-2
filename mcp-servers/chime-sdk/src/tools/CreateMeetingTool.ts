import { Tool } from "@modelcontextprotocol/sdk/server/index.js";
import { ChimeSDKClient } from "../client.js";
import { z } from "zod";

const CreateMeetingSchema = z.object({
  title: z.string().describe("Title of the meeting"),
  startTime: z.string().optional().describe("Start time in ISO format (defaults to now)"),
  attendees: z.array(z.string()).optional().describe("List of attendee names"),
});

export class CreateMeetingTool extends Tool {
  constructor(private chimeClient: ChimeSDKClient) {
    super({
      name: "create_meeting",
      description: "Create a new video meeting with specified title and attendees",
      inputSchema: CreateMeetingSchema,
    });
  }

  async execute(input: z.infer<typeof CreateMeetingSchema>): Promise<string> {
    try {
      const startTime = input.startTime || new Date().toISOString();
      const attendees = input.attendees || [];

      const meeting = await this.chimeClient.createMeeting(
        input.title,
        startTime,
        attendees
      );

      return `Successfully created meeting:
- Meeting ID: ${meeting.meetingId}
- Title: ${meeting.title}
- Start Time: ${meeting.startTime}
- Attendees: ${meeting.attendees.join(', ') || 'None'}
- Status: ${meeting.status}`;
    } catch (error) {
      return `Error creating meeting: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
