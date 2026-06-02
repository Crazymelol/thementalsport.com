# Mina — voice-first AI agent (web prototype)

This is the first working version of Mina, built as a web app so you can talk
to her in your browser with almost no setup. It's the v0 prototype described in
[`../MINA_PRD.md`](../MINA_PRD.md); the full local desktop version is the
longer-term goal.

## What works today

- 🎙️ **Talk to her** — click the mic and speak (or just type). She replies in
  voice and text. Voice uses your browser's built-in speech — no installs.
- 🧠 **Her brain is Claude** (`claude-opus-4-8`) via a streaming server route.
- 🛡️ **The safety model is real.** She can look things up freely (read), but
  **sending email, issuing refunds, creating events, or writing files always
  pops an approval card** — nothing irreversible happens without your click.
- 🔌 **Calendar, email, Stripe, and files** are wired as tools — today they
  return realistic sample data (stubs). Swapping in real APIs later doesn't
  change anything else.

## Run it on your computer

You need [Node.js](https://nodejs.org) (the LTS version) installed once.

```bash
# 1. from this folder:
npm install

# 2. give Mina a brain — get a key at https://console.anthropic.com
cp .env.example .env.local
#    then open .env.local and paste your key after ANTHROPIC_API_KEY=

# 3. start her
npm run dev
```

Open **http://localhost:3000**. For the best voice experience, use **Chrome or
Edge**. (Typing works in any browser.)

## Put it online (a link you can use anywhere)

Because the code is on GitHub, you can deploy it free on
[Vercel](https://vercel.com) with a few clicks — no terminal:

1. vercel.com → sign in with GitHub → **Add New → Project**
2. Import this repo. Set **Root Directory** to **`mina`**.
3. Add an **Environment Variable**: `ANTHROPIC_API_KEY` = your key.
4. **Deploy**. You'll get a link like `mina-xxxx.vercel.app`.

## How it's built

```
src/
  app/
    page.tsx            UI: orb, conversation, voice, approval cards
    api/chat/route.ts   Mina's brain — streaming + manual tool-use loop + gates
  components/
    MinaOrb.tsx         her "presence" (idle/listening/thinking/speaking)
    ActionCard.tsx      the approval gate for write actions
  hooks/
    useVoice.ts         browser speech-to-text + text-to-speech
  lib/
    tools.ts            the tool router (calendar/email/stripe/files stubs + tiers)
    systemPrompt.ts     Mina's persona, voice style, and safety rules
    types.ts            shared client/server types
```

**Why a manual tool loop?** Read-only tools run automatically. Write tools are
*not* executed by the server — it streams an "action required" event and stops.
The UI shows an approval card; your decision is sent back and only then does the
approved action run. That human-in-the-loop gate is the whole point.

## Honest limitations (this is a prototype)

- Integrations are **stubs** — no real calendar/inbox/Stripe yet.
- Voice quality and recognition depend on your **browser**, not local Whisper.
- The brain is **cloud Claude**, so this isn't yet the "everything stays on your
  machine" version the PRD describes. That's the desktop build, later.

## What's next

Wire one real integration end-to-end (Google Calendar is the usual first),
persist conversation memory, then begin the local/desktop migration.
