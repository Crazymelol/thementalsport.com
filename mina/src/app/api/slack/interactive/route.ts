// Slack Interactive Components endpoint.
//
// Slack sends a POST here when the user clicks Approve or Cancel on one of
// Mike's write-action approval messages. We verify the signature, decode the
// button payload (which carries the full conversation state), then either
// run the approved write via runBrain or post a cancellation notice.

import { verifySlackSignature, postMessage, slackConfigured } from "@/lib/slack";
import { runBrain } from "@/lib/brain";
import type { ApiMessage, ActionProposal } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const rawBody = await req.text();

  if (!slackConfigured() || !(await verifySlackSignature(req, rawBody))) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Slack sends interactive payloads as URL-encoded `payload=<json>`.
  const params = new URLSearchParams(rawBody);
  const payloadRaw = params.get("payload");
  if (!payloadRaw) return new Response("OK");

  let payload: {
    actions?: { action_id: string; value: string }[];
  };
  try {
    payload = JSON.parse(payloadRaw) as typeof payload;
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  const action = payload.actions?.[0];
  if (!action) return new Response("OK");

  let buttonValue: {
    actionId: string;
    approved: boolean;
    payload: string;
  };
  try {
    buttonValue = JSON.parse(action.value) as typeof buttonValue;
  } catch {
    return new Response("Bad value", { status: 400 });
  }

  let conversationState: {
    channelId: string;
    messages: ApiMessage[];
    pendingActions: ActionProposal[];
  };
  try {
    conversationState = JSON.parse(buttonValue.payload) as typeof conversationState;
  } catch {
    return new Response("Bad conversation payload", { status: 400 });
  }

  const { channelId, messages, pendingActions } = conversationState;

  if (!buttonValue.approved) {
    await postMessage(channelId, "Understood — action cancelled.");
    return new Response("OK");
  }

  // Build the decisions map: approve just this action.
  const decisions: Record<string, boolean> = {};
  for (const pa of pendingActions) {
    decisions[pa.id] = pa.id === buttonValue.actionId;
  }

  const result = await runBrain({ messages, decisions });

  if (result.error) {
    await postMessage(channelId, `⚠️ ${result.error}`);
    return new Response("OK");
  }

  if (result.text) await postMessage(channelId, result.text);

  return new Response("OK");
}
