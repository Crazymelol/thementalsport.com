# Training App v1 — 48-Day Program + AI Coach (Android)

_Design spec — 2026-06-28_

## Summary

A native Android app (Expo / React Native, TypeScript) that turns the existing
48-day "Titans Protocol" article series into a daily-unlock training program,
adds guided breathing tools, on-device streaks/progress, a daily reminder, and
an **AI mental-performance coach** chat backed by the already-deployed `mina/`
agent backend re-skinned with a coach persona. No user accounts in v1.

## Problem

The training content (48-day program, 36-lesson course, worksheets, narrated
audio) exists but is only consumable as website articles and a
password-gated YouTube playlist. There is no daily habit loop, no progress,
no reminders, and no interactive coaching. Mobile is where daily training
habits live; nothing mobile exists today.

## Goals

- Ship a free Android app delivering the 48-day program as a daily practice.
- Working offline for all content; coach is the only online feature.
- An AI coach grounded in *our* protocols (not generic LLM advice).
- Drive course/book sales via outbound links.

## Non-goals (v1)

- User accounts, cross-device sync, iOS build (architecture must not block
  any of these for v2).
- Serving content from an API/CMS (content is bundled).
- Play Billing / in-app purchases — the app is fully free.
- Voice chat with the coach.

## Architecture

Five components, three of which reuse existing assets:

1. **`app/`** — new Expo project (managed workflow, TypeScript), Android-first.
2. **`scripts/app-content/`** — build-time content pipeline (markdown → JSON).
3. **`mina/`** — existing deployed Next.js agent backend, extended with a
   `coach` agent + `/api/coach` endpoint.
4. Existing content: `src/content/articles/titans-protocol-day-{01..48}.md`,
   protocols from `course/FULL-COURSE.md`.
5. Existing Shopify checkout URLs for monetization links.

### 1. The app (`app/`)

Tabs (bottom navigation):

- **Today** — the current day's lesson: title, story, protocol, action step
  (rendered markdown), and a "Mark day complete" button. Shows streak.
- **Program** — all 48 days with locked / unlocked / completed states.
- **Tools** — guided breathing exercises as animated timers:
  - *Box Breathing* (4-4-4-4, from the course's Navy SEAL lesson)
  - *Physiological Sigh* (double inhale + long exhale, from the course)
  Each is a config-driven animation (phase durations in JSON), optional
  looping session length (1/3/5 min). Uses existing narrated audio clips only
  if a suitable clip exists; otherwise silent with haptics.
- **Coach** — chat UI (streamed responses) to `/api/coach`.

**Unlock model (time-based):** `startDate` is stored at first launch. Day N
unlocks when `daysSince(startDate) >= N-1`. Missed days stay unlocked
(catch-up allowed); future days stay locked. Rationale: keeps the "one new
thing per day" cadence without punishing a missed day.

**Streak:** completing any day increments the streak if the last completion
was yesterday or today; otherwise the streak resets to 1. Longest streak is
also stored.

**Progress storage:** AsyncStorage via a small typed store module
(`app/src/store/progress.ts`): `{startDate, completedDays: number[],
streak, longestStreak, lastCompletedAt, deviceId}`. `deviceId` is a UUID
generated at first launch (used only as the coach memory namespace).

**Notifications:** `expo-notifications` **local** scheduled daily
notification at a user-configurable time (default 08:00): "Day N is ready".
No push server. Re-scheduled on app open (content of the notification derives
from current unlock state).

### 2. Content pipeline (`scripts/app-content/`)

A TypeScript script (run manually, output committed) that parses the 48
articles with gray-matter (already a repo dependency for the site) and emits:

```json
{
  "version": 1,
  "generatedAt": "…",
  "days": [
    {
      "day": 1,
      "title": "The Biology of Choking (And How to Hack It)",
      "description": "Why your body freezes…",
      "tags": ["Mental Toughness", "Anxiety"],
      "body": "<markdown body verbatim>"
    }
  ]
}
```

- `day` comes from the filename (`titans-protocol-day-NN`), `title` strips the
  `"Day N: "` prefix from frontmatter.
- The body stays **markdown** (rendered in-app with
  `react-native-markdown-display`) — no fragile section parsing.
- The script writes **two committed copies** (same content, one source of
  truth = the script):
  - `app/assets/content/titans.json` (bundled into the APK)
  - `mina/src/data/coach-content.json` (for the coach's tools — required
    because Vercel builds `mina/` with root dir `mina`, so it cannot read
    files outside `mina/` at build time)
- Validation built into the script: exactly 48 days, contiguous 1..48,
  non-empty title/body — exits non-zero otherwise.

Breathing tool configs are hand-authored JSON in the app (not parsed from the
course): `{id, name, phases: [{label, seconds}], source}`.

### 3. The coach (extend `mina/`)

**Security invariant (the most important line in this spec):** the public
coach endpoint must never be able to reach Mina's operator tools (Gmail,
Calendar, Drive, Stripe, shell) nor the skill/self-improvement tools.
`toolsForAgent()` auto-merges `SKILL_TOOLS` + `SELF_IMPROVE_TOOLS` +
`MEMORY_TOOLS` into every agent — so the coach path gets its own
`toolsForCoach()` allowlist instead of reusing `toolsForAgent()`, and
`/api/coach` pins the agent to `coach` (no `router.ts` in the path).

New pieces, following existing `mina/` patterns:

- **`coach` agent** in `agents.ts` (`AgentDef` shape): persona addon rewrites
  "Jarvis chief-of-staff" into a mental-performance coach in Giannis's
  direct, athlete-first voice. Guardrails in the addon: performance/mindset
  coaching only; no medical, clinical, or mental-health treatment advice; on
  crisis signals, respond with empathy and point to professional help; keep
  answers short and actionable; ground advice in the provided protocols when
  relevant (cite the day/lesson by name).
- **Coach tools** in `tools.ts` (both read-only, backed by
  `coach-content.json`):
  - `get_day_lesson({day})` → that day's title/description/body.
  - `search_protocols({query})` → top matches over title/description/tags/body
    (simple case-insensitive scoring; no embeddings in v1).
- **Memory, namespaced:** coach requests use principal key
  `coach:<deviceId>` so the memory tools (`remember`/`recall`/`forget` — the
  only non-coach tools exposed) keep athletes' facts separate from each other
  and from the operator's memory.
- **`/api/coach/route.ts`:** SSE streaming like `/api/chat`, reusing
  `brain.ts`'s think-act loop with the coach tool allowlist. Auth:
  - `x-app-token` header must equal env `COACH_APP_TOKEN` (new Vercel env
    var; also baked into the app build via `EXPO_PUBLIC_…` — accepted v1
    trade-off, revisit with real accounts in v2).
  - `x-device-id` header: UUID; requests without it are rejected.
  - Rate limit per device via the existing Upstash Redis: 30 messages per
    device per UTC day, 429 beyond — cost control on free-tier providers.
- **History:** the app holds the session transcript client-side and sends the
  last ~12 messages per request; durable facts go through coach memory. No
  server-side chat log in v1.
- Model/providers: unchanged (existing council + failover in `providers.ts`).

### 4. Monetization

- "Go deeper" cards (end of Day 48, Tools tab footer, coach suggestion when
  relevant) open the existing Shopify course/book checkout in the external
  browser.
- **Play-policy note:** Google Play requires Play Billing only for digital
  goods consumed *in the app*. The course/books are consumed on the website /
  YouTube, and no app feature is gated on purchase — so external links are
  compliant. We never phrase links as "unlock the app".

### 5. Ship checklist (user-side, needed only at release time)

- Google Play developer account ($25 one-time).
- Expo/EAS account for store builds.
- `COACH_APP_TOKEN` env var added in Vercel (Mina project).

Development and testing use local Expo builds / emulator and a locally-run
`mina` dev server — none of the above blocks the build.

## Testing

- **App logic (jest-expo):** unlock math (day boundaries, catch-up), streak
  transitions (same-day, next-day, gap, reset), progress-store round-trip,
  content JSON schema validation (48 contiguous days).
- **Content script:** run against the real articles; its built-in validation
  is the test. A `--check` mode verifies committed JSON is up to date with
  the sources (usable in CI later).
- **Coach (vitest, existing `mina/` suite):** `toolsForCoach()` exposes
  exactly the allowlist (assert Gmail/Stripe/skill/self-improve tools are
  absent); `get_day_lesson` / `search_protocols` return expected content;
  `/api/coach` rejects missing/wrong token and missing device id; memory key
  namespacing.
- **Manual:** end-to-end on the Android emulator; coach against deployed
  Mina.

## Risks & mitigations

- **Coach cost/abuse:** public endpoint on free-tier LLM providers →
  per-device daily rate limit + short max-token responses; token is
  rotatable (env var).
- **Extracted app token:** accepted for v1 (rate limits bound the damage);
  real auth lands with accounts in v2.
- **Play review friction:** external purchase links are informational; no
  gated features. If rejected, remove links and resubmit (content unaffected).
- **Coach latency/failover:** council already degrades across 4 providers;
  the UI shows streaming immediately and a friendly retry state.
- **Expo/emulator constraints in the dev sandbox:** if the Android emulator
  is unavailable in this environment, logic tests + Expo web preview cover
  development; a debug APK via EAS happens when accounts exist.

## v2 pointers (explicitly out of scope)

Accounts + sync (replaces device UUID + app token), iOS, coach voice mode,
in-app course delivery with Play Billing, server-side chat history, richer
protocol search (embeddings).

## Decisions log

- Time-based daily unlock over finish-to-unlock (keeps cadence; forgiving).
- Markdown-in-JSON over parsed sections (YAGNI; preserves authoring).
- Two committed JSON copies over shared import (Vercel root-dir constraint).
- Bypass `router.ts` for `/api/coach` (security isolation; single agent).
- Local notifications over push service (no server, meets the need).
