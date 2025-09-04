import { Tool } from "@modelcontextprotocol/sdk/server/index.js";
import { ChimeSDKClient } from "../client.js";
import { z } from "zod";

const StopScreenShareSchema = z.object({
  meetingId: z.string().describe("Meeting ID"),
  attendeeId: z.string().describe("Attendee ID to stop screen sharing for"),
});

export class StopScreenShareTool extends Tool {
  constructor(private chimeClient: ChimeSDKClient) {
    super({
      name: "stop_screen_share",
      description: "Stop screen sharing for a specific attendee in a meeting",
      inputSchema: StopScreenShareSchema,
    });
  }

  async execute(input: z.infer<typeof StopScreenShareSchema>): Promise<string> {
    try {
      await this.chimeClient.stopScreenShare(input.meetingId, input.attendeeId);
      return `Successfully stopped screen sharing for attendee ${input.attendeeId} in meeting ${input.meetingId}`;
    } catch (error) {
      return `Error stopping screen sharing: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
