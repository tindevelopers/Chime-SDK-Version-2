import { Tool } from "@modelcontextprotocol/sdk/server/index.js";
import { ChimeSDKClient } from "../client.js";
import { z } from "zod";

const StartVideoSchema = z.object({
  meetingId: z.string().describe("Meeting ID"),
  attendeeId: z.string().describe("Attendee ID to start video for"),
});

export class StartVideoTool extends Tool {
  constructor(private chimeClient: ChimeSDKClient) {
    super({
      name: "start_video",
      description: "Start video for a specific attendee in a meeting",
      inputSchema: StartVideoSchema,
    });
  }

  async execute(input: z.infer<typeof StartVideoSchema>): Promise<string> {
    try {
      await this.chimeClient.startVideo(input.meetingId, input.attendeeId);
      return `Successfully started video for attendee ${input.attendeeId} in meeting ${input.meetingId}`;
    } catch (error) {
      return `Error starting video: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
