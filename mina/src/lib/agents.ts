import { toolDefsForApi } from "./tools";
import type { AgentId } from "./types";
import type OpenAI from "openai";

type AgentDef = {
  id: AgentId;
  label: string;
  toolNames: string[];
  promptAddon: string;
};

const MEMORY_TOOLS = ["remember", "recall", "forget"];

export const AGENTS: Record<AgentId, AgentDef> = {
  inbox: {
    id: "inbox",
    label: "Inbox",
    toolNames: ["search_emails", "send_email"],
    promptAddon:
      "\n\n# Your role\nYou are Jarvis's email specialist. Only use email tools. Be precise about recipients. Never send an email without showing the draft and going through the approval gate.",
  },
  calendar: {
    id: "calendar",
    label: "Calendar",
    toolNames: ["get_calendar_events", "create_calendar_event"],
    promptAddon:
      "\n\n# Your role\nYou are Jarvis's calendar specialist. Only use calendar tools. Always confirm the date, time, and attendees before creating events. Flag conflicts proactively.",
  },
  workspace: {
    id: "workspace",
    label: "Workspace",
    toolNames: [
      "search_drive",
      "read_drive_file",
      "read_doc",
      "create_doc",
      "read_sheet",
      "append_sheet_row",
      "search_contacts",
    ],
    promptAddon:
      "\n\n# Your role\nYou are Jarvis's workspace specialist for Google Drive, Docs, Sheets, and Contacts. Only use workspace tools. Always confirm before creating or modifying files.",
  },
  finance: {
    id: "finance",
    label: "Finance",
    toolNames: ["get_revenue_summary", "issue_refund"],
    promptAddon:
      "\n\n# Your role\nYou are Jarvis's finance specialist. Only use finance tools. Refunds always require explicit double-confirmation — always show the amount and recipient before requesting approval.",
  },
  general: {
    id: "general",
    label: "General",
    toolNames: ["browse_url"],
    promptAddon:
      "\n\n# Your role\nYou are Jarvis's general assistant. Handle conversation, web browsing, and anything that doesn't fit a specialist lane.",
  },
};

const ALL_TOOL_DEFS = toolDefsForApi() as OpenAI.Chat.Completions.ChatCompletionTool[];

/** Returns the OpenAI tool defs for a given agent, always including memory tools. */
export function toolsForAgent(
  id: AgentId,
): OpenAI.Chat.Completions.ChatCompletionTool[] {
  const agent = AGENTS[id];
  const toolNames = new Set([...agent.toolNames, ...MEMORY_TOOLS]);
  return ALL_TOOL_DEFS.filter((t) => toolNames.has(t.function.name));
}

/** Reverse-lookup: which agent owns this tool name? Falls back to "general". */
export function getAgentForTool(toolName: string): AgentId {
  for (const agent of Object.values(AGENTS)) {
    if (agent.toolNames.includes(toolName)) return agent.id;
  }
  return "general";
}
