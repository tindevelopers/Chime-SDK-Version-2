#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallTool,
  ListMeetingsTool,
  CreateMeetingTool,
  JoinMeetingTool,
  LeaveMeetingTool,
  MuteAudioTool,
  UnmuteAudioTool,
  StartVideoTool,
  StopVideoTool,
  ShareScreenTool,
  StopScreenShareTool,
} from "./tools/index.js";
import { ChimeSDKClient } from "./client.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

class ChimeSDKMCP extends Server {
  private chimeClient: ChimeSDKClient;

  constructor() {
    super({
      name: "chime-sdk-mcp-server",
      version: "1.0.0",
    });

    this.chimeClient = new ChimeSDKClient();
    this.setupTools();
  }

  private setupTools() {
    // Meeting management tools
    this.tool(new ListMeetingsTool(this.chimeClient));
    this.tool(new CreateMeetingTool(this.chimeClient));
    this.tool(new JoinMeetingTool(this.chimeClient));
    this.tool(new LeaveMeetingTool(this.chimeClient));

    // Audio/Video control tools
    this.tool(new MuteAudioTool(this.chimeClient));
    this.tool(new UnmuteAudioTool(this.chimeClient));
    this.tool(new StartVideoTool(this.chimeClient));
    this.tool(new StopVideoTool(this.chimeClient));

    // Screen sharing tools
    this.tool(new ShareScreenTool(this.chimeClient));
    this.tool(new StopScreenShareTool(this.chimeClient));

    // General call tool
    this.tool(new CallTool(this.chimeClient));
  }
}

const server = new ChimeSDKMCP();
const transport = new StdioServerTransport();
server.connect(transport);

console.error("ChimeSDK MCP Server started");
