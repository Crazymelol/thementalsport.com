// Slack plumbing — server-side only.
//
// Env vars (set manually in Vercel after creating the Slack app):
//   SLACK_BOT_TOKEN    — xoxb-... token from OAuth & Permissions
//   SLACK_SIGNING_SECRET — from Basic Information → App Credentials
//   SLACK_ALLOWED_USERS — optional comma-separated Slack user IDs to restrict
//                         access (e.g. "U12345,U67890"). Leave empty to allow
//                         anyone in the workspace.

import { createHmac, timingSafeEqual } from "crypto";
import type { ActionProposal } from "./types";

export function slackConfigured(): boolean {
  return Boolean(process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET);
}

/** Returns the list of allowed Slack user IDs, or null meaning "everyone". */
export function allowedUsers(): string[] | null {
  const raw = process.env.SLACK_ALLOWED_USERS ?? "";
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return ids.length > 0 ? ids : null;
}

/** Verify a request genuinely came from Slack. Returns true if valid. */
export async function verifySlackSignature(req: Request, rawBody: string): Promise<boolean> {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return false;

  const ts = req.headers.get("x-slack-request-timestamp") ?? "";
  const sig = req.headers.get("x-slack-signature") ?? "";

  // Replay attack guard — reject requests older than 5 minutes.
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;

  const baseString = `v0:${ts}:${rawBody}`;
  const expected = "v0=" + createHmac("sha256", secret).update(baseString).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** Post a plain text message to a Slack channel or DM. */
export async function postMessage(channel: string, text: string): Promise<void> {
  await slackApi("chat.postMessage", { channel, text });
}

/** Post an approval block (Approve / Cancel buttons) for a pending write action. */
export async function postApprovalMessage(
  channel: string,
  action: ActionProposal,
  /** The full serialised conversation to thread through the button payload. */
  conversationPayload: string,
): Promise<void> {
  const blocks = [
    {
      type: "section",
      text: { type: "mrkdwn", text: `*${action.title}*\n${action.detail}` },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "✅ Approve" },
          style: "primary",
          action_id: "approve",
          value: JSON.stringify({ actionId: action.id, approved: true, payload: conversationPayload }),
        },
        {
          type: "button",
          text: { type: "plain_text", text: "❌ Cancel" },
          style: "danger",
          action_id: "cancel",
          value: JSON.stringify({ actionId: action.id, approved: false, payload: conversationPayload }),
        },
      ],
    },
  ];
  await slackApi("chat.postMessage", { channel, blocks });
}

async function slackApi(method: string, body: Record<string, unknown>): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("SLACK_BOT_TOKEN not set.");
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Slack API ${method} failed: ${res.status}`);
  const json = (await res.json()) as { ok: boolean; error?: string };
  if (!json.ok) throw new Error(`Slack API ${method} error: ${json.error}`);
}
