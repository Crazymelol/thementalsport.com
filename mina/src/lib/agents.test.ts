import { describe, expect, it } from "vitest";
import { toolsForAgent, getAgentForTool, AGENTS } from "./agents";

describe("toolsForAgent", () => {
  it("inbox agent has search_emails and send_email", () => {
    const names = toolsForAgent("inbox").map((t) => t.function.name);
    expect(names).toContain("search_emails");
    expect(names).toContain("send_email");
  });

  it("inbox agent does NOT have calendar tools", () => {
    const names = toolsForAgent("inbox").map((t) => t.function.name);
    expect(names).not.toContain("get_calendar_events");
  });

  it("every agent includes remember, recall, forget", () => {
    for (const id of Object.keys(AGENTS) as (keyof typeof AGENTS)[]) {
      const names = toolsForAgent(id).map((t) => t.function.name);
      expect(names).toContain("remember");
      expect(names).toContain("recall");
      expect(names).toContain("forget");
    }
  });

  it("calendar agent has get_calendar_events and create_calendar_event", () => {
    const names = toolsForAgent("calendar").map((t) => t.function.name);
    expect(names).toContain("get_calendar_events");
    expect(names).toContain("create_calendar_event");
  });

  it("workspace agent has all drive/doc/sheet/contacts tools", () => {
    const names = toolsForAgent("workspace").map((t) => t.function.name);
    expect(names).toContain("search_drive");
    expect(names).toContain("read_drive_file");
    expect(names).toContain("read_doc");
    expect(names).toContain("create_doc");
    expect(names).toContain("read_sheet");
    expect(names).toContain("append_sheet_row");
    expect(names).toContain("search_contacts");
  });

  it("finance agent has get_revenue_summary and issue_refund", () => {
    const names = toolsForAgent("finance").map((t) => t.function.name);
    expect(names).toContain("get_revenue_summary");
    expect(names).toContain("issue_refund");
  });

  it("general agent has browse_url", () => {
    const names = toolsForAgent("general").map((t) => t.function.name);
    expect(names).toContain("browse_url");
  });
});

describe("getAgentForTool", () => {
  it("maps send_email → inbox", () => {
    expect(getAgentForTool("send_email")).toBe("inbox");
  });
  it("maps create_calendar_event → calendar", () => {
    expect(getAgentForTool("create_calendar_event")).toBe("calendar");
  });
  it("maps issue_refund → finance", () => {
    expect(getAgentForTool("issue_refund")).toBe("finance");
  });
  it("maps append_sheet_row → workspace", () => {
    expect(getAgentForTool("append_sheet_row")).toBe("workspace");
  });
  it("maps browse_url → general", () => {
    expect(getAgentForTool("browse_url")).toBe("general");
  });
  it("returns general for unknown tool", () => {
    expect(getAgentForTool("nonexistent_tool")).toBe("general");
  });
});
