import { Tool } from "@modelcontextprotocol/sdk/server/index.js";
import { ChimeSDKClient } from "../client.js";
import { z } from "zod";

const UnmuteAudioSchema = z.object({
  meetingId: z.string().describe("Meeting ID"),
  attendeeId: z.string().describe("Attendee ID to unmute"),
});

export class UnmuteAudioTool extends Tool {
  constructor(private chimeClient: ChimeSDKClient) {
    super({
      name: "unmute_audio",
      description: "Unmute audio for a specific attendee in a meeting",
      inputSchema: UnmuteAudioSchema,
    });
  }

  async execute(input: z.infer<typeof UnmuteAudioSchema>): Promise<string> {
    try {
      await this.chimeClient.unmuteAudio(input.meetingId, input.attendeeId);
      return `Successfully unmuted audio for attendee ${input.attendeeId} in meeting ${input.meetingId}`;
    } catch (error) {
      return `Error unmuting audio: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
