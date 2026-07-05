// Public coach endpoint for the training app. SSE, same wire shape as
// /api/chat (delta / error / done ServerEvents) so the app client stays dumb.
// Auth: x-app-token (shared secret) + x-device-id (UUID) — see lib/coach.ts.
// Rate limit: 30 messages/device/UTC day via Upstash (fails open when the
// store is unconfigured, e.g. local dev).
import { runCoach, checkCoachAuth } from "@/lib/coach";
import { incrDailyCounter } from "@/lib/memory";
import { trimHistory } from "@/lib/history";
import type { ApiMessage, ServerEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAILY_LIMIT = 30;

export async function POST(req: Request) {
  const auth = checkCoachAuth(req.headers);
  if (!auth.ok) return new Response(auth.message, { status: auth.status });

  let body: { messages: ApiMessage[] };
  try {
    body = (await req.json()) as { messages: ApiMessage[] };
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response("messages required", { status: 400 });
  }

  const day = new Date().toISOString().slice(0, 10);
  const n = await incrDailyCounter(`coach:rl:${auth.deviceId}:${day}`);
  if (n !== null && n > DAILY_LIMIT) {
    return new Response("Daily coach limit reached — back tomorrow.", { status: 429 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ServerEvent) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        const result = await runCoach({ messages: trimHistory(body.messages), deviceId: auth.deviceId });
        if (result.error) send({ type: "error", message: result.error });
        else if (result.text) send({ type: "delta", text: result.text });
        send({ type: "done" });
      } catch {
        send({ type: "error", message: "Coach failed — try again." });
        send({ type: "done" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
