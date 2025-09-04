import { Tool } from "@modelcontextprotocol/sdk/server/index.js";
import { ChimeSDKClient } from "../client.js";
import { z } from "zod";

const StopVideoSchema = z.object({
  meetingId: z.string().describe("Meeting ID"),
  attendeeId: z.string().describe("Attendee ID to stop video for"),
});

export class StopVideoTool extends Tool {
  constructor(private chimeClient: ChimeSDKClient) {
    super({
      name: "stop_video",
      description: "Stop video for a specific attendee in a meeting",
      inputSchema: StopVideoSchema,
    });
  }

  async execute(input: z.infer<typeof StopVideoSchema>): Promise<string> {
    try {
      await this.chimeClient.stopVideo(input.meetingId, input.attendeeId);
      return `Successfully stopped video for attendee ${input.attendeeId} in meeting ${input.meetingId}`;
    } catch (error) {
      return `Error stopping video: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
