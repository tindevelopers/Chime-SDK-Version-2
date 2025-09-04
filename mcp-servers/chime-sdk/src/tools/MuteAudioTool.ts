import { Tool } from "@modelcontextprotocol/sdk/server/index.js";
import { ChimeSDKClient } from "../client.js";
import { z } from "zod";

const MuteAudioSchema = z.object({
  meetingId: z.string().describe("Meeting ID"),
  attendeeId: z.string().describe("Attendee ID to mute"),
});

export class MuteAudioTool extends Tool {
  constructor(private chimeClient: ChimeSDKClient) {
    super({
      name: "mute_audio",
      description: "Mute audio for a specific attendee in a meeting",
      inputSchema: MuteAudioSchema,
    });
  }

  async execute(input: z.infer<typeof MuteAudioSchema>): Promise<string> {
    try {
      await this.chimeClient.muteAudio(input.meetingId, input.attendeeId);
      return `Successfully muted audio for attendee ${input.attendeeId} in meeting ${input.meetingId}`;
    } catch (error) {
      return `Error muting audio: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
