# Mina — Voice-First AI Agent
## Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Author:** Product Team  
**Date:** 2026-06-02

---

## 1. Executive Summary

Mina is a voice-first, always-available personal AI agent that lives on your local machine. She manages your calendar, email, finances (Stripe), files, and documents through natural spoken conversation — acting as a proactive chief of staff rather than a passive assistant. Mina runs locally for privacy and low latency, integrates deeply with external services via secure OAuth, and exposes a minimal but extensible UI that gets out of the way until you need it.

---

## 2. Problem Statement

Power users — founders, operators, creators — spend 2–4 hours per day on coordination tasks: triaging email, scheduling, chasing payments, organizing files, and context-switching between tools. Existing AI assistants are reactive, cloud-only, siloed, and voice-optional rather than voice-first. Mina eliminates that overhead by combining continuous voice availability with deep local system access and broad integration reach.

---

## 3. Goals & Success Metrics

| Goal | Metric | Target (6 months) |
|---|---|---|
| Reduce coordination overhead | Time saved / week | ≥ 5 hours |
| High task completion rate | Tasks completed without follow-up | ≥ 85% |
| Low latency | Voice-to-response (local LLM) | < 1.5s |
| High retention | DAU / MAU | ≥ 0.7 |
| Trust & privacy | Zero cloud audio leaks | 100% |

---

## 4. Non-Goals (v1.0)

- Multi-user / team support
- Mobile app (desktop-first only)
- Real-time collaboration features
- Fine-tuning or training custom models
- Replacing full-featured email clients (Mina augments, not replaces)

---

## 5. User Personas

### Primary: "The Operator"
Solo founder or indie creator. Manages their own calendar, email, billing, and files. Wants to offload coordination without hiring. Values privacy — doesn't want recordings sent to a cloud service.

### Secondary: "The Deep Worker"
Knowledge worker who needs uninterrupted focus. Wants Mina to buffer and summarize interruptions, manage scheduling autonomously within rules, and draft communications for review.

---

## 6. Architecture Overview

```
┌─────────────────────────────────────────────┐
│                 Mina Desktop App             │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Voice    │  │  Chat    │  │  File    │  │
│  │  Engine   │  │  UI      │  │  Browser │  │
│  └─────┬─────┘  └────┬─────┘  └────┬─────┘  │
│        └─────────────┴─────────────┘        │
│                       │                     │
│              ┌────────▼────────┐            │
│              │  Mina Core (LLM │            │
│              │  + Tool Router) │            │
│              └────────┬────────┘            │
│                       │                     │
│   ┌───────────────────┼──────────────────┐  │
│   │                   │                  │  │
│ ┌─▼──────┐  ┌─────────▼──┐  ┌──────────▼┐  │
│ │Calendar│  │   Email    │  │  Stripe   │  │
│ │ Tool   │  │   Tool     │  │   Tool    │  │
│ └────────┘  └────────────┘  └───────────┘  │
│                                            │
│ ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│ │  Files   │  │  Shell   │  │  Memory   │  │
│ │  Tool    │  │  Tool    │  │  Store    │  │
│ └──────────┘  └──────────┘  └───────────┘  │
└─────────────────────────────────────────────┘
```

**Runtime stack:**
- Electron (cross-platform desktop shell)
- Local LLM via Ollama (primary) with Claude API fallback for complex tasks
- Whisper (local STT — audio never leaves the machine)
- Kokoro / Piper TTS (local voice synthesis)
- SQLite for memory, tasks, and audit log
- Node.js tool layer with sandboxed shell access

---

## 7. Feature Specifications

---

### 7.1 Voice Engine

#### 7.1.1 Wake Word Detection
- Always-listening wake word: "Hey Mina" (Porcupine or OpenWakeWord)
- Configurable alternative wake words
- Visual indicator: subtle ring animation in system tray when listening
- Hotkey override: user-configurable global hotkey (default `Cmd+Shift+M`)

#### 7.1.2 Speech-to-Text
- Local Whisper model (medium.en for speed, large for accuracy)
- Streaming transcription — Mina begins processing before the user finishes speaking
- Silence detection to auto-end utterance (configurable 0.5–2s threshold)
- Edge case: background noise — noise gate + VAD (voice activity detection) to ignore non-speech

#### 7.1.3 Text-to-Speech
- Local Kokoro/Piper synthesis — Mina's voice, no cloud dependency
- Configurable speed, pitch, voice persona
- Interrupt handling: user can say "stop" mid-response to cancel playback
- Edge case: long responses — Mina summarizes verbally, offers "I'll show the full output on screen"

#### 7.1.4 Conversation Context
- Rolling 20-turn context window maintained per session
- Cross-session memory via Memory Store (see 7.6)
- Mina tracks conversation topic and gracefully handles topic shifts

---

### 7.2 Calendar Integration

**Auth:** Google Calendar OAuth 2.0 + CalDAV for Apple Calendar / Outlook

#### 7.2.1 Capabilities
| Command | Example |
|---|---|
| Read schedule | "What's on my calendar tomorrow?" |
| Create event | "Schedule a call with Alex Friday at 3pm for 45 minutes" |
| Find free time | "When am I free next week for a 2-hour deep work block?" |
| Reschedule | "Move my 2pm to Thursday same time" |
| Cancel | "Cancel tomorrow's standup and send regrets" |
| Smart scheduling | "Block 90 minutes every morning for focused work, avoid before 9am" |

#### 7.2.2 Edge Cases
- **Conflict detection:** Mina flags double-bookings and suggests alternatives before confirming
- **Timezone handling:** Mina asks or infers timezone when ambiguous; stores user's default
- **Recurring events:** Mina confirms "just this occurrence or all future?" before modifying a series
- **External attendees:** Mina does not send calendar invites without explicit confirmation
- **Calendar not connected:** Graceful degradation — Mina explains what's missing and guides OAuth setup

#### 7.2.3 Proactive Behavior
- Morning briefing: "Good morning. You have 3 meetings today. Your first is at 9am with Sarah. You have a 90-minute gap from 11–12:30."
- Pre-meeting prep: 15 minutes before a meeting, Mina surfaces relevant emails and notes
- Buffer enforcement: if the user schedules meetings back-to-back, Mina suggests a 5-minute buffer

---

### 7.3 Email Integration

**Auth:** Gmail OAuth (gmail.readonly + gmail.modify + gmail.send), IMAP/SMTP for others

#### 7.3.1 Capabilities
| Command | Example |
|---|---|
| Triage inbox | "What needs my attention in email?" |
| Read email | "Read me the email from Jordan about the contract" |
| Draft reply | "Draft a reply to Sarah accepting the proposal, keep it brief" |
| Send (with confirmation) | "Send it" / "Actually, add that I'll follow up by Friday" |
| Search | "Find emails from last month about the launch" |
| Summarize thread | "Summarize the thread with the design team" |
| Unsubscribe | "Unsubscribe me from this newsletter" |
| Label / archive | "Archive everything from this sender older than 30 days" |

#### 7.3.2 Safety Model
- **Mina never sends email without reading the draft back and receiving explicit confirmation.** This is non-negotiable and cannot be configured away.
- Mina shows draft in UI overlay and reads it aloud (or summarizes for long emails)
- Confirmation must be a clear affirmative: "yes", "send it", "looks good" — not just silence
- Edge case: ambiguous confirm ("ok" mid-sentence) — Mina asks "Just to confirm — send this now?"

#### 7.3.3 Priority Triage
- Mina maintains a learned sender priority list (high / medium / low)
- Flags: awaiting reply from user, time-sensitive, from known VIPs
- Daily triage summary delivered at a user-configured time

#### 7.3.4 Edge Cases
- **Reply-all risk:** Mina warns if a draft will go to a large group
- **Attachment handling:** Mina can read/summarize attachments (PDF, DOCX) but does not auto-attach files without explicit instruction
- **OAuth token expiry:** Mina proactively re-authenticates and notifies the user

---

### 7.4 Stripe / Finance Integration

**Auth:** Stripe API key (restricted: read + refunds + invoices — no key creation/deletion)

#### 7.4.1 Capabilities
| Command | Example |
|---|---|
| Revenue summary | "How much did I make this month?" |
| Recent transactions | "Show me the last 5 payments" |
| Customer lookup | "What's the subscription status for john@example.com?" |
| Issue refund | "Refund the last charge from Alex" |
| Create invoice | "Create a $500 invoice for consulting services for Acme Corp" |
| Send invoice | "Send the invoice to billing@acme.com" |
| Subscription overview | "How many active subscribers do I have?" |
| Churn alert | "Who cancelled in the last 7 days?" |

#### 7.4.2 Safety Model
- Refunds and invoice sends require explicit double-confirmation: Mina states the amount and recipient, user confirms
- Read operations: no confirmation required
- Write operations (invoices, refunds): always confirm
- Destructive operations (subscription cancellation on behalf of user): require typed confirmation in UI, not just voice
- Mina does NOT have access to Stripe API key management, webhook configuration, or account settings

#### 7.4.3 Edge Cases
- **Multiple Stripe accounts:** User can register multiple accounts; Mina asks "which account?" when ambiguous
- **Currency:** Mina normalizes to user's preferred display currency, flags multi-currency discrepancies
- **Failed payments:** Mina proactively surfaces failed/past-due charges during daily briefing
- **Disputes:** Mina surfaces open disputes and can draft response text but cannot submit to Stripe directly (links to dashboard)

---

### 7.5 Local File System Access

**Scope:** User-configured root directories (default: `~/Documents`, `~/Desktop`, `~/Downloads`)

#### 7.5.1 Capabilities
| Command | Example |
|---|---|
| Find file | "Find my Q1 report" |
| Read file | "Read me the notes from last week's meeting" |
| Create file | "Create a new markdown file called project-ideas in my docs folder" |
| Edit file | "Add a section called 'Next Steps' to that document" |
| Move / rename | "Move all the PDFs in Downloads to Archive/2025" |
| Delete (to trash) | "Delete the draft files in my desktop folder" |
| Summarize | "Summarize the contents of the contracts folder" |
| Search content | "Find all files that mention 'Acme Corp'" |
| Directory overview | "What's in my projects folder?" |

#### 7.5.2 Safety Model
- Deletes go to OS trash by default — permanent delete requires `--force` confirmation
- Moves and renames: Mina states what will happen and confirms before executing when affecting > 3 files
- File writes: Mina shows a diff/preview in UI before writing to existing files
- Allowed directories are sandboxed — Mina cannot access paths outside configured roots without explicit unlock
- No execution of scripts or binaries found in the filesystem without explicit user command

#### 7.5.3 Edge Cases
- **Large directories:** Mina paginates results; "show more" pattern in UI
- **Binary files:** Mina declines to read, offers metadata only
- **Symlinks:** Mina follows symlinks but warns if target is outside the sandbox
- **File conflicts on move:** Mina detects and asks "overwrite, rename, or skip?"
- **iCloud / Dropbox sync:** Mina detects cloud-synced folders and warns before bulk operations

#### 7.5.4 Supported File Types (read/edit)
- Text: `.txt`, `.md`, `.markdown`, `.rst`
- Code: `.js`, `.ts`, `.py`, `.rb`, `.go`, `.rs`, `.sh`, `.json`, `.yaml`, `.toml`, `.env` (masked)
- Documents: `.pdf` (read only), `.docx`, `.xlsx` (read only), `.csv`
- Email exports: `.eml`, `.mbox`

---

### 7.6 Memory Store

Mina maintains persistent memory across sessions using a local SQLite database.

#### 7.6.1 Memory Types

| Type | Example | Retention |
|---|---|---|
| User preferences | "I prefer morning meetings" | Permanent |
| Factual notes | "Alex's company is Acme Corp" | Until corrected |
| Task context | "Follow up with Jordan on Friday" | Until resolved |
| Session summaries | What happened in past conversations | 90 days (configurable) |
| Learned patterns | Email triage weights, scheduling rules | Rolling update |

#### 7.6.2 Memory Commands
- "Remember that…" — explicit memory write
- "Forget that…" — explicit memory delete
- "What do you know about Alex?" — memory query
- "Show me everything you've remembered" — full memory dump in UI

#### 7.6.3 Edge Cases
- **Conflicting memories:** Mina surfaces the conflict and asks user to resolve
- **Stale memories:** Mina flags memories older than 60 days when they're used, asks if still valid
- **Privacy:** All memory lives in local SQLite; no cloud sync unless user opts in

---

### 7.7 Shell / System Access

**Scope:** Sandboxed execution environment with allowlist

#### 7.7.1 Capabilities
- Run allowlisted shell commands (git status, npm test, etc.)
- Capture stdout/stderr and summarize results
- Open applications ("Open Figma", "Open the file in VS Code")
- System status ("How much disk space do I have?", "What's using my CPU?")

#### 7.7.2 Safety Model
- Allowlist of approved commands stored in config — Mina cannot execute commands not on the list without user approval
- User can expand the allowlist via settings
- Mina NEVER runs commands with `sudo` unless the allowlist explicitly includes `sudo <specific-command>`
- Destructive shell commands (rm, mv to /dev/null, pipe to shell) require typed UI confirmation
- All executed commands are logged to audit trail

---

### 7.8 UI / Desktop Shell

#### 7.8.1 States

| State | Appearance |
|---|---|
| Idle | Small floating avatar or system tray icon |
| Listening | Pulsing ring animation, live transcript overlay |
| Thinking | Subtle spinner, partial response if streaming |
| Speaking | Waveform animation |
| Action pending | Action card with confirm / cancel |
| Busy (background task) | Tray icon badge with progress |

#### 7.8.2 Primary Views
- **Conversation panel:** Scrollable chat log with voice transcript + Mina responses
- **Action cards:** Structured previews before any write operation (email draft, calendar event, file diff)
- **File browser:** Embedded file explorer scoped to sandboxed directories
- **Integrations dashboard:** Connection status for all tools, token health, last sync
- **Memory viewer:** Browsable, searchable memory store
- **Audit log:** Timestamped record of every action Mina took
- **Settings:** Wake word, voice, sandbox roots, allowlists, briefing schedule

#### 7.8.3 Edge Cases
- **Offline mode:** Mina degrades gracefully — local LLM + file tools work; cloud integrations show offline status
- **Multiple monitors:** Mina anchors to user's primary display; draggable
- **Full screen apps:** Mina uses a HUD overlay mode (semi-transparent, non-blocking)
- **Accessibility:** All UI elements keyboard-navigable; screen reader support for action cards

---

## 8. Integrations Roadmap

### Phase 1 (v1.0 — MVP)
- [x] Google Calendar
- [x] Gmail
- [x] Stripe
- [x] Local file system
- [x] Shell (sandboxed)

### Phase 2 (v1.5)
- [ ] Apple Calendar / iCal
- [ ] Outlook / Microsoft 365
- [ ] Notion
- [ ] Linear / GitHub Issues
- [ ] Slack (read + post to designated channels)

### Phase 3 (v2.0)
- [ ] Browser automation (Playwright-backed)
- [ ] Zapier / Make webhook triggers
- [ ] QuickBooks / Wave (accounting)
- [ ] Twilio (SMS send/receive)
- [ ] Custom plugin API (third-party tool integrations)

---

## 9. Privacy & Security Model

| Concern | Mitigation |
|---|---|
| Voice recordings | Whisper runs 100% locally; no audio ever sent to cloud |
| API credentials | Stored in OS keychain (Keytar), never in plaintext files |
| LLM inference | Local Ollama by default; Claude API used only for complex tasks with user opt-in |
| File access | Sandboxed to user-configured roots; accessed paths logged |
| Email content | Processed locally; only tool call results (not raw email bodies) sent to LLM context |
| Memory / SQLite | Local only; optional encrypted export |
| Audit log | Immutable append-only log; user can export but not edit |
| OAuth tokens | Stored in OS keychain; refresh handled automatically; revocable from integrations dashboard |
| Network | All outbound calls to external APIs are logged; user can view in integrations dashboard |

---

## 10. Confirmation & Safety Framework

Every Mina action falls into one of four risk tiers:

| Tier | Examples | Confirmation Required |
|---|---|---|
| **Read** | Check calendar, read email, query Stripe | None |
| **Reversible Write** | Create draft email, create calendar event | Voice confirm ("yes" / "do it") |
| **Hard-to-Reverse Write** | Send email, issue refund, move files | Voice confirm + UI action card review |
| **Destructive** | Permanent delete, bulk operations, cancel subscriptions | Typed confirmation in UI |

Mina always announces what she's about to do before doing it. She never silently takes action.

---

## 11. Error Handling & Edge Cases (Global)

| Scenario | Mina's Behavior |
|---|---|
| Integration auth expired | Notifies user proactively; guides re-auth |
| LLM inference timeout | Falls back to Claude API; notifies user |
| STT misheard command | Reads back what she heard; asks "Is that right?" |
| Ambiguous intent | Asks one clarifying question, not multiple |
| Conflicting instructions | Surfaces the conflict; asks which to prioritize |
| Rate limit hit (API) | Queues the request; notifies user of delay |
| No internet | Local tools continue; cloud tools show graceful offline message |
| Disk full | Warns before any write operation that would fail |
| Crashed mid-task | On restart, Mina shows "I was in the middle of X — resume or discard?" |

---

## 12. Onboarding Flow

1. **Install** — single installer (`.dmg` / `.exe`); Ollama installed if absent
2. **Wake word calibration** — user says "Hey Mina" 3× to calibrate
3. **Connect integrations** — guided OAuth flow; skip any, add later
4. **Set sandbox roots** — file picker to choose allowed directories
5. **Morning briefing time** — configure or skip
6. **First conversation** — Mina introduces herself and her capabilities
7. **"Try saying…"** — 5 example prompts surfaced in UI

---

## 13. Technical Dependencies

| Component | Library / Service |
|---|---|
| Desktop shell | Electron |
| Local LLM | Ollama (llama3, mistral, or qwen2.5) |
| Cloud LLM fallback | Claude API (claude-sonnet-4-6) |
| Speech-to-text | OpenAI Whisper (local, via whisper.cpp) |
| Text-to-speech | Kokoro-82M or Piper |
| Wake word | OpenWakeWord |
| Voice Activity Detection | Silero VAD |
| Credential storage | Keytar (OS keychain) |
| Local database | SQLite (better-sqlite3) |
| Calendar | Google Calendar API v3, CalDAV |
| Email | Gmail API v1, Nodemailer (SMTP) |
| Payments | Stripe Node SDK |
| File ops | Node.js fs + chokidar |
| Shell execution | execa (sandboxed) |
| PDF parsing | pdf-parse |
| DOCX parsing | mammoth |
| UI framework | React + Tailwind CSS (within Electron) |

---

## 14. Open Questions

1. **Local LLM quality bar:** Which tasks require Claude API vs. can be handled by a local 7B model? Needs benchmarking.
2. **Voice persona:** Should Mina's voice be configurable, or is a single polished persona better for brand consistency?
3. **Multi-account email:** How should Mina handle users with 2–3 email accounts? Unified inbox or per-account?
4. **Plugin API:** What's the right abstraction for third-party tool developers? MCP-compatible or custom?
5. **Mobile companion:** Should v2 include a companion iOS/Android app that proxies to the local Mina instance over LAN?
6. **Billing / distribution:** Local app — one-time purchase, subscription, or open source + paid cloud features?

---

## 15. Acceptance Criteria (v1.0 MVP)

- [ ] Voice wake word activates Mina within 500ms on a modern MacBook
- [ ] STT accuracy ≥ 95% in a quiet room
- [ ] Calendar: create, read, and reschedule events via voice, with conflict detection
- [ ] Email: read, draft, and send (with confirmation) via Gmail OAuth
- [ ] Stripe: read revenue and customer data; issue refund with double-confirm
- [ ] File system: read, create, edit, move, and delete (to trash) within sandbox
- [ ] All write operations gated by confirmation tier (Section 10)
- [ ] All actions logged to immutable audit trail
- [ ] App runs offline with local tools; cloud tools fail gracefully
- [ ] Onboarding completes in < 5 minutes for a non-technical user

---

*End of document. Next step: technical spike on local LLM quality vs. latency tradeoffs.*
