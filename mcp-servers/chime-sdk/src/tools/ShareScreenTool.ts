import { Tool } from "@modelcontextprotocol/sdk/server/index.js";
import { ChimeSDKClient } from "../client.js";
import { z } from "zod";

const ShareScreenSchema = z.object({
  meetingId: z.string().describe("Meeting ID"),
  attendeeId: z.string().describe("Attendee ID to start screen sharing for"),
});

export class ShareScreenTool extends Tool {
  constructor(private chimeClient: ChimeSDKClient) {
    super({
      name: "share_screen",
      description: "Start screen sharing for a specific attendee in a meeting",
      inputSchema: ShareScreenSchema,
    });
  }

  async execute(input: z.infer<typeof ShareScreenSchema>): Promise<string> {
    try {
      await this.chimeClient.shareScreen(input.meetingId, input.attendeeId);
      return `Successfully started screen sharing for attendee ${input.attendeeId} in meeting ${input.meetingId}`;
    } catch (error) {
      return `Error starting screen sharing: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
