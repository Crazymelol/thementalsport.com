// Client for mina's /api/coach SSE endpoint. RN's built-in fetch can't stream
// response bodies; expo/fetch can, so we parse the SSE frames from its reader.
import { fetch as expoFetch } from "expo/fetch";

export type CoachMessage = { role: "user" | "assistant"; content: string };

const COACH_URL = process.env.EXPO_PUBLIC_COACH_URL ?? "http://10.0.2.2:3000"; // Android-emulator localhost
const APP_TOKEN = process.env.EXPO_PUBLIC_COACH_TOKEN ?? "devtoken";
const HISTORY_LIMIT = 12;

/** POSTs the conversation; resolves with the coach's reply text. Throws on HTTP/stream errors. */
export async function askCoach(messages: CoachMessage[], deviceId: string): Promise<string> {
  const res = await expoFetch(`${COACH_URL}/api/coach`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-app-token": APP_TOKEN, "x-device-id": deviceId },
    body: JSON.stringify({ messages: messages.slice(-HISTORY_LIMIT) }),
  });
  if (res.status === 429) throw new Error("Daily coach limit reached — back tomorrow.");
  if (!res.ok) throw new Error(`Coach unavailable (${res.status}).`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let reply = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = frame.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      const event = JSON.parse(line.slice(6)) as { type: string; text?: string; message?: string };
      if (event.type === "delta" && event.text) reply += event.text;
      if (event.type === "error") throw new Error(event.message ?? "Coach error.");
      if (event.type === "done") return reply;
    }
  }
  return reply;
}
