import { Tool } from "@modelcontextprotocol/sdk/server/index.js";
import { ChimeSDKClient } from "../client.js";
import { z } from "zod";

const ListMeetingsSchema = z.object({
  status: z.enum(["all", "scheduled", "active", "ended"]).optional().describe("Filter by meeting status"),
});

export class ListMeetingsTool extends Tool {
  constructor(private chimeClient: ChimeSDKClient) {
    super({
      name: "list_meetings",
      description: "List all meetings with optional status filtering",
      inputSchema: ListMeetingsSchema,
    });
  }

  async execute(input: z.infer<typeof ListMeetingsSchema>): Promise<string> {
    try {
      const meetings = await this.chimeClient.listMeetings();
      
      if (meetings.length === 0) {
        return "No meetings found.";
      }

      let filteredMeetings = meetings;
      if (input.status && input.status !== "all") {
        filteredMeetings = meetings.filter(m => m.status === input.status);
      }

      if (filteredMeetings.length === 0) {
        return `No meetings found with status: ${input.status}`;
      }

      const meetingList = filteredMeetings.map(meeting => 
        `📅 ${meeting.title}
   ID: ${meeting.meetingId}
   Status: ${meeting.status}
   Start: ${new Date(meeting.startTime).toLocaleString()}
   Attendees: ${meeting.attendees.length}`
      ).join('\n\n');

      return `Found ${filteredMeetings.length} meeting(s):\n\n${meetingList}`;
    } catch (error) {
      return `Error listing meetings: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
