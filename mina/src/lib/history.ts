// Conversation trimming for the web channel.
//
// The web app persists the whole session in sessionStorage and re-sends the
// entire growing conversation on every turn. Left unbounded, context balloons
// until a single turn exceeds the route's time budget — the browser "spins then
// shows nothing". Slack doesn't hit this because it only ever sends the last
// ~10 messages of channel history. This mirrors that cap for the web.
//
// Trimming must NEVER split an assistant(tool_calls) message from its following
// tool result messages, or Groq rejects the request. We keep a tail of the most
// recent messages, then advance the window start forward to the next `user`
// message so the slice always begins on a clean turn boundary.

import type { ApiMessage } from "./types";

/** Keep roughly the last `maxMessages`, snapped to a user-message boundary. */
export function trimHistory(messages: ApiMessage[], maxMessages = 24): ApiMessage[] {
  if (messages.length <= maxMessages) return messages;

  let start = messages.length - maxMessages;
  // Don't begin mid tool-sequence: advance to the next user message.
  while (start < messages.length && messages[start].role !== "user") start++;

  // If we somehow ran past the end (no user message in the tail), fall back to
  // the original rather than send an empty/invalid history.
  if (start >= messages.length) return messages;

  return messages.slice(start);
}
