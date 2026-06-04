// Real Gmail access for Mina — read/search via IMAP, send via SMTP.
//
// This uses a Gmail "App Password" (a 16-char code from the user's Google
// account) rather than full OAuth, so there's no Google Cloud project to set
// up. Credentials live only server-side, in env vars:
//
//   GMAIL_USER          the address, e.g. you@gmail.com
//   GMAIL_APP_PASSWORD  the 16-char app password (spaces are stripped)
//
// If the env vars are absent, the caller falls back to stub data so the app
// still runs without a connected inbox.

import { ImapFlow, type SearchObject } from "imapflow";
import nodemailer from "nodemailer";

export type EmailHit = {
  from: string;
  subject: string;
  snippet: string;
  unread: boolean;
};

export function gmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function creds() {
  const user = process.env.GMAIL_USER ?? "";
  const pass = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s+/g, "");
  return { user, pass };
}

/** Search the inbox for a free-text query across sender, subject, and body. */
export async function searchEmails(query: string, limit = 8): Promise<EmailHit[]> {
  const { user, pass } = creds();
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  const hits: EmailHit[] = [];
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const q = query?.trim();
      const criteria: SearchObject = q
        ? { or: [{ from: q }, { subject: q }, { body: q }] }
        : { all: true };

      const seqs = (await client.search(criteria)) || [];
      const chosen = seqs.slice(-limit).reverse();
      if (chosen.length === 0) return hits;

      for await (const msg of client.fetch(chosen, { envelope: true, flags: true })) {
        const env = msg.envelope;
        const fromAddr = env?.from?.[0];
        const from = fromAddr
          ? `${fromAddr.name || fromAddr.address || "Unknown"}${
              fromAddr.address ? ` <${fromAddr.address}>` : ""
            }`
          : "Unknown";
        hits.push({
          from,
          subject: env?.subject || "(no subject)",
          snippet: env?.date ? new Date(env.date).toLocaleString() : "",
          unread: !(msg.flags?.has("\\Seen") ?? false),
        });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
  return hits;
}

/**
 * Move all inbox emails matching a free-text query to Gmail Trash. Destructive
 * (but recoverable — Gmail keeps trashed mail for ~30 days). Returns how many
 * were trashed and a sample of the senders affected.
 */
export async function trashEmails(
  query: string,
): Promise<{ trashed: number; senders: string[]; query: string }> {
  const { user, pass } = creds();
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const q = query?.trim();
      if (!q) return { trashed: 0, senders: [], query: q ?? "" };

      const criteria: SearchObject = { or: [{ from: q }, { subject: q }, { body: q }] };
      const seqs = (await client.search(criteria)) || [];
      if (seqs.length === 0) return { trashed: 0, senders: [], query: q };

      // Capture a sample of senders for the result summary (cap the fetch).
      const senderSet = new Set<string>();
      for await (const msg of client.fetch(seqs.slice(0, 25), { envelope: true })) {
        const addr = msg.envelope?.from?.[0];
        const label = addr?.name || addr?.address;
        if (label) senderSet.add(label);
      }

      // Gmail exposes Trash as the special-use mailbox "[Gmail]/Trash".
      await client.messageMove(seqs, "[Gmail]/Trash");
      return { trashed: seqs.length, senders: [...senderSet], query: q };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

/** Send an email via Gmail SMTP. Throws on failure. */
export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const { user, pass } = creds();
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  await transport.sendMail({ from: user, to, subject, text: body });
}
