// Web-app chat route. Accepts a ChatRequest, streams ServerEvents as SSE.
// The actual thinking happens in lib/brain.ts — this file only handles the
// HTTP framing and converts BrainResult events into the SSE wire format.

import { runBrain } from "@/lib/brain";
import { trimHistory } from "@/lib/history";
import type { ChatRequest, ServerEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Raise the ceiling: the web app re-sends the whole conversation, so a turn can
// run several tool loops. (Vercel caps this at the plan limit — 60s on Hobby —
// but asking for more is harmless and helps on Pro.) We also cap context below.
export const maxDuration = 300;

export async function POST(req: Request) {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ServerEvent) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

      if (!process.env.GROQ_API_KEY) {
        send({ type: "error", message: "Mike has no API key. Add GROQ_API_KEY to your environment." });
        send({ type: "done" });
        controller.close();
        return;
      }

      try {
        // Cap the conversation we feed the brain. The web app accumulates the
        // whole session and re-sends it every turn; unbounded, that grows until
        // a turn times out (the "spins then nothing" symptom). Slack avoids this
        // by only sending recent history — trimHistory mirrors that, snapping to
        // a clean turn boundary so tool-call/result pairs are never split.
        const result = await runBrain({
          messages: trimHistory(body.messages),
          decisions: body.decisions,
        });

        if (result.error) {
          send({ type: "error", message: result.error });
          send({ type: "done" });
          controller.close();
          return;
        }

        // Emit tool cards.
        for (const card of result.cards) {
          send({ type: "tool_card", toolName: card.toolName, data: card.data });
        }

        // Emit the assistant message and text delta (web app shows both).
        const lastMsg = result.messages[result.messages.length - 1];
        if (lastMsg?.role === "assistant") {
          send({ type: "assistant", message: lastMsg });
          if (result.text) send({ type: "delta", text: result.text });
        }

        // If a write action needs approval, send the gate event.
        if (result.pendingActions && result.pendingActions.length > 0) {
          // Include the full updated messages for the client to re-send on decision.
          send({ type: "tool_result", messages: result.messages });
          send({ type: "action_required", actions: result.pendingActions });
        }

        send({ type: "done" });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Something went wrong.",
        });
        send({ type: "done" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
