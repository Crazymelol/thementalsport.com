// Shared types for Mina's client <-> server protocol.
// Kept SDK-free so the browser bundle never imports the Anthropic SDK.

export type Tier = "read" | "write";

/** Content blocks — a light mirror of the Anthropic message shape. */
export type TextBlock = { type: "text"; text: string };
export type ToolUseBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
};
export type ToolResultBlock = {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
};
export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

/** A single turn in the conversation, in API shape. */
export type ApiMessage = {
  role: "user" | "assistant";
  content: string | ContentBlock[];
};

/** A write-tier action Mina wants to take, surfaced to the user for approval. */
export type ActionProposal = {
  id: string; // the tool_use id
  name: string; // tool name, e.g. "send_email"
  tier: Tier;
  title: string; // short, human title for the card
  detail: string; // the specifics ("To: alex@... / Subject: ...")
};

/** Request body the client POSTs to /api/chat. */
export type ChatRequest = {
  messages: ApiMessage[];
  /** Present only when the user is responding to pending action cards. */
  decisions?: Record<string, boolean>; // tool_use_id -> approved?
};

/** Server-Sent Events streamed back from /api/chat. */
export type ServerEvent =
  | { type: "delta"; text: string } // streamed assistant text
  | { type: "assistant"; content: ContentBlock[] } // a completed assistant turn
  | { type: "tool_result"; content: ContentBlock[] } // an appended tool_result turn
  | { type: "action_required"; actions: ActionProposal[] } // awaiting user approval
  | { type: "done" }
  | { type: "error"; message: string };
