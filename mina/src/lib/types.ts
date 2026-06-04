// Shared client/server types. Mina's brain runs on Groq (OpenAI-compatible
// chat API), so the conversation is stored in OpenAI message shape.

export type Tier = "read" | "write";

export type AgentId = "inbox" | "calendar" | "workspace" | "finance" | "general";

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

// Conversation messages, in OpenAI chat shape.
export type ApiMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

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
  | { type: "assistant"; message: ApiMessage }
  | { type: "tool_result"; messages: ApiMessage[] }
  | { type: "tool_card"; toolName: string; data: unknown }
  | { type: "action_required"; actions: ActionProposal[] }
  | { type: "agent"; agentId: AgentId }
  | { type: "done" }
  | { type: "error"; message: string };
