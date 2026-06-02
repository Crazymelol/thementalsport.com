import type Anthropic from "@anthropic-ai/sdk";

export type Tier = "read" | "write";

export type ContentBlock = Anthropic.ContentBlock;

export type ApiMessage = {
  role: "user" | "assistant";
  content: string | ContentBlock[];
};

export type ActionProposal = {
  id: string;
  name: string;
  tier: Tier;
  title: string;
  detail: string;
};

export type ChatRequest = {
  messages: ApiMessage[];
  decisions?: Record<string, boolean>;
};

export type ServerEvent =
  | { type: "delta"; text: string }
  | { type: "assistant"; content: ContentBlock[] }
  | { type: "tool_result"; content: ContentBlock[] }
  | { type: "tool_card"; toolName: string; data: unknown }
  | { type: "action_required"; actions: ActionProposal[] }
  | { type: "done" }
  | { type: "error"; message: string };
