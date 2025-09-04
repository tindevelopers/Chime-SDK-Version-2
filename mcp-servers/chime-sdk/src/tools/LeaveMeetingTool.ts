import { Tool } from "@modelcontextprotocol/sdk/server/index.js";
import { ChimeSDKClient } from "../client.js";
import { z } from "zod";

const LeaveMeetingSchema = z.object({
  meetingId: z.string().describe("Meeting ID to leave"),
  attendeeId: z.string().describe("Attendee ID leaving the meeting"),
});

export class LeaveMeetingTool extends Tool {
  constructor(private chimeClient: ChimeSDKClient) {
    super({
      name: "leave_meeting",
      description: "Leave an active meeting",
      inputSchema: LeaveMeetingSchema,
    });
  }

  async execute(input: z.infer<typeof LeaveMeetingSchema>): Promise<string> {
    try {
      await this.chimeClient.leaveMeeting(input.meetingId, input.attendeeId);
      return `Successfully left meeting ${input.meetingId}`;
    } catch (error) {
      return `Error leaving meeting: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
