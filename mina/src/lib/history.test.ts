import { describe, it, expect } from "vitest";
import { trimHistory } from "./history";
import type { ApiMessage } from "./types";

const user = (c: string): ApiMessage => ({ role: "user", content: c });
const assistant = (c: string): ApiMessage => ({ role: "assistant", content: c });
const toolCall = (): ApiMessage =>
  ({ role: "assistant", content: null, tool_calls: [{ id: "t1", type: "function", function: { name: "x", arguments: "{}" } }] }) as ApiMessage;
const toolResult = (): ApiMessage => ({ role: "tool", tool_call_id: "t1", content: "ok" }) as ApiMessage;

describe("trimHistory", () => {
  it("returns history unchanged when under the cap", () => {
    const msgs = [user("a"), assistant("b")];
    expect(trimHistory(msgs, 24)).toBe(msgs);
  });

  it("trims to a tail that begins on a user message", () => {
    const msgs: ApiMessage[] = [];
    for (let i = 0; i < 30; i++) msgs.push(user(`u${i}`), assistant(`a${i}`));
    const out = trimHistory(msgs, 10);
    expect(out.length).toBeLessThanOrEqual(10);
    expect(out[0].role).toBe("user");
  });

  it("never starts mid tool-sequence (keeps assistant tool_calls with its tool result)", () => {
    // ...filler..., user, assistant(tool_calls), tool, assistant(final)
    const msgs: ApiMessage[] = [
      user("old1"), assistant("old1r"), user("old2"), assistant("old2r"),
      user("ask"), toolCall(), toolResult(), assistant("done"),
    ];
    const out = trimHistory(msgs, 4); // tail would start at toolCall — must snap forward
    expect(out[0].role).toBe("user");
    // The kept slice must not contain a leading orphan tool message.
    expect(out[0].role).not.toBe("tool");
  });

  it("preserves a trailing assistant tool_calls message (approval re-run)", () => {
    const msgs: ApiMessage[] = [];
    for (let i = 0; i < 20; i++) msgs.push(user(`u${i}`), assistant(`a${i}`));
    msgs.push(user("approve please"), toolCall());
    const out = trimHistory(msgs, 6);
    const last = out[out.length - 1];
    expect("tool_calls" in last).toBe(true);
  });
});
