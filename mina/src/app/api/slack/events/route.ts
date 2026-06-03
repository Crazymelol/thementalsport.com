// Slack Events API endpoint.
//
// Slack sends a POST here whenever:
//   - someone DMs the Mike bot
//   - someone @mentions Mike in a channel he belongs to
//
// Flow:
//   1. Verify the request is genuinely from Slack (HMAC signature)
//   2. Respond to the one-time URL verification challenge
//   3. For message events: run Mike's brain, post the reply
//   4. If a write action is pending: post Approve/Cancel buttons instead

import { verifySlackSignature, allowedUsers, postMessage, postApprovalMessage, slackConfigured } from "@/lib/slack";
import { runBrain } from "@/lib/brain";
import type { ApiMessage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const rawBody = await req.text();

  // Slack URL-verification challenge (sent once during app setup).
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  if (parsed.type === "url_verification") {
    return Response.json({ challenge: parsed.challenge });
  }

  // Verify every real request.
  if (!slackConfigured() || !(await verifySlackSignature(req, rawBody))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const event = parsed.event as Record<string, unknown> | undefined;
  if (!event) return new Response("OK");

  // Ignore bot messages (including Mike's own replies) to avoid loops.
  if (event.bot_id || event.subtype === "bot_message") return new Response("OK");
  if (event.type !== "message" && event.type !== "app_mention") return new Response("OK");

  const userId = String(event.user ?? "");
  const channelId = String(event.channel ?? "");
  const text = stripMention(String(event.text ?? "")).trim();

  if (!text || !channelId) return new Response("OK");

  // Access control: if SLACK_ALLOWED_USERS is set, only those IDs can use Mike.
  const allowed = allowedUsers();
  if (allowed && !allowed.includes(userId)) {
    await postMessage(channelId, "Sorry — I only work for my owner.");
    return new Response("OK");
  }

  // Fetch recent channel history for context (last 10 messages).
  const history = await fetchHistory(channelId, 10);
  const messages: ApiMessage[] = [
    ...history,
    { role: "user", content: text },
  ];

  // Run Mike's brain.
  const result = await runBrain({ messages });

  if (result.error) {
    await postMessage(channelId, `⚠️ ${result.error}`);
    return new Response("OK");
  }

  // If a write action needs approval, post buttons instead of the reply.
  if (result.pendingActions && result.pendingActions.length > 0) {
    const action = result.pendingActions[0];
    // Encode the current conversation so the interactive handler can resume it.
    const conversationPayload = JSON.stringify({
      channelId,
      messages: result.messages,
      pendingActions: result.pendingActions,
    });
    await postApprovalMessage(channelId, action, conversationPayload);
    return new Response("OK");
  }

  // Plain reply.
  if (result.text) await postMessage(channelId, result.text);

  return new Response("OK");
}

/** Remove the @Mike mention from a message so the brain doesn't see it. */
function stripMention(text: string): string {
  return text.replace(/^<@[A-Z0-9]+>\s*/i, "");
}

/** Fetch recent channel messages and convert to ApiMessage format. */
async function fetchHistory(channel: string, limit: number): Promise<ApiMessage[]> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return [];
  try {
    const res = await fetch(
      `https://slack.com/api/conversations.history?channel=${channel}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const json = (await res.json()) as {
      ok: boolean;
      messages?: { text?: string; bot_id?: string; user?: string }[];
    };
    if (!json.ok || !json.messages) return [];
    // Slack returns newest-first; reverse to chronological.
    return json.messages
      .reverse()
      .filter((m) => m.text && !m.bot_id)
      .map((m) => ({ role: "user" as const, content: m.text! }));
  } catch {
    return [];
  }
}
