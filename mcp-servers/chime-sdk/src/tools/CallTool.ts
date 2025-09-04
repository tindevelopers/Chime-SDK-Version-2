import { Tool } from "@modelcontextprotocol/sdk/server/index.js";
import { ChimeSDKClient } from "../client.js";
import { z } from "zod";

const CallSchema = z.object({
  action: z.enum(["create", "join", "leave", "list"]),
  meetingId: z.string().optional(),
  title: z.string().optional(),
  attendeeName: z.string().optional(),
});

export class CallTool extends Tool {
  constructor(private chimeClient: ChimeSDKClient) {
    super({
      name: "call",
      description: "Perform general call operations like create, join, leave, or list meetings",
      inputSchema: CallSchema,
    });
  }

  async execute(input: z.infer<typeof CallSchema>): Promise<string> {
    try {
      switch (input.action) {
        case "create":
          if (!input.title) {
            throw new Error("Title is required for creating a meeting");
          }
          const meeting = await this.chimeClient.createMeeting(
            input.title,
            new Date().toISOString(),
            []
          );
          return `Created meeting: ${meeting.meetingId} - ${meeting.title}`;

        case "join":
          if (!input.meetingId || !input.attendeeName) {
            throw new Error("Meeting ID and attendee name are required for joining");
          }
          const attendee = await this.chimeClient.joinMeeting(input.meetingId, input.attendeeName);
          return `Joined meeting ${input.meetingId} as ${attendee.name}`;

        case "leave":
          if (!input.meetingId) {
            throw new Error("Meeting ID is required for leaving");
          }
          await this.chimeClient.leaveMeeting(input.meetingId, "current-attendee");
          return `Left meeting ${input.meetingId}`;

        case "list":
          const meetings = await this.chimeClient.listMeetings();
          if (meetings.length === 0) {
            return "No active meetings found";
          }
          return `Active meetings:\n${meetings.map(m => `- ${m.meetingId}: ${m.title} (${m.status})`).join('\n')}`;

        default:
          throw new Error(`Unknown action: ${input.action}`);
      }
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
