#!/usr/bin/env node
// Auto-blog generator. Reads content-pipeline/queue.json, takes the next N
// pending topics, turns each into a full SEO article (frontmatter + body + FAQ)
// and writes it to src/content/articles/<slug>.md dated today. Marks each item
// published. The workflow (.github/workflows/blog-autopublish.yml) then commits,
// rebuilds, and deploys.
//
// Generation runs through Groq's free OpenAI-compatible API (same provider the
// mina backend uses). Set GROQ_API_KEY as a repo secret to activate it. With no
// key, the script exits cleanly having done nothing, so the workflow is a no-op
// rather than a failure. A queue item that already carries a `body` is published
// verbatim with no model call (useful for hand-written drips).
//
// Env:
//   GROQ_API_KEY    required to generate (absent => graceful no-op)
//   POSTS_PER_RUN   how many to generate this run (default 2)
//   GROQ_MODEL      override the model (default llama-3.3-70b-versatile)

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const QUEUE_PATH = path.join(ROOT, 'content-pipeline', 'queue.json');
const ARTICLES_DIR = path.join(ROOT, 'src', 'content', 'articles');
const SHORTS_DIR = path.join(ROOT, 'content-pipeline', 'shorts');
const PER_RUN = Math.max(1, parseInt(process.env.POSTS_PER_RUN || '2', 10));
const MODELS = [
  process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
  'llama-3.1-8b-instant',
];

const STYLE = `You are a staff writer for The Mental Sport (thementalsport.com), the mental-performance brand of coach and author Giannis Notaras. Write ONE SEO blog article.

VOICE: blunt, direct, practical coach. Second person ("you"). Short paragraphs. Vary sentence length. No fluff or hype.

STRUCTURE (for SEO + AI Overviews):
1) Open with a 2-3 sentence DIRECT ANSWER to the target query in the first ~50 words, using the exact keyword phrase. No heading before it.
2) Then ## sections (clear, often question-shaped); ### where useful.
3) At least one numbered, named step-by-step protocol.
4) Weave in the given internal links as markdown links with descriptive anchor text, naturally in prose.
5) Mention the recommended book ONCE, naturally, as a resource (not salesy).
6) End with a short punchy takeaway section (never titled "Conclusion").
7) 1000-1400 words.

ACCURACY: Reference only real, established ideas, named correctly (e.g. growth mindset — Carol Dweck; self-distanced self-talk — Ethan Kross; the physiological sigh — Andrew Huberman/Stanford). Never invent statistics, studies, institutions, or quotes; write "studies show" rather than fabricating numbers.

ANTI-AI-WRITING (strict): NO em dashes anywhere (use commas, colons, parentheses, periods). Do not use: delve, leverage, foster, robust, comprehensive, crucial, vital, seamless, streamline, unveil, myriad, plethora, holistic, nuanced, tapestry, testament, realm. Do not use: "in today's", "in the realm of", "that being said", "at its core", "it's worth noting", "in conclusion", "to sum up", "at the end of the day". Do not start sentences with "By [verb]ing". Avoid filler intensifiers (very, really, truly, simply, basically, actually).

OUTPUT — return EXACTLY this and nothing else (no preamble, no title/H1, no frontmatter):
<markdown body starting with the direct-answer paragraph>
===FAQ===
Q: <question>
A: <answer, 1-3 sentences>
Q: <question>
A: <answer>
Q: <question>
A: <answer>
Q: <question>
A: <answer>
===DESCRIPTION===
<one line, 150-160 characters, includes the primary keyword>`;

const SHORT_STYLE = `You write 30-45 second vertical short-form video scripts (TikTok / Reels / YouTube Shorts) for The Mental Sport, coach Giannis Notaras' mental-performance brand for athletes and sports parents. Blunt, punchy, one idea, spoken plainly. No em dashes, no filler.

From the article, produce ONE script. The hook must stop the scroll in the first line (a bold claim, a sharp question, or "If you [problem], do this"). Three short spoken beats. End on a CTA to the free quiz or free chapter.

Output EXACTLY this markdown and nothing else:
# {TITLE} — Short
**Hook (0-3s):** ...
**Beat 1:** ...
**Beat 2:** ...
**Beat 3:** ...
**CTA:** Take the free 2-minute Mental Game quiz at thementalsport.com/quiz (or grab the free chapter).
**On-screen text:** short line 1 / short line 2 / short line 3
**Caption:** one scroll-stopping caption with the CTA
**Hashtags:** 6-8 relevant hashtags`;

function buildUserPrompt(item) {
  const links = (item.internalLinks || []).join(' , ');
  return `ARTICLE SPEC:
- TITLE (reference only, do NOT output it): ${item.title}
- TARGET QUERY / primary keyword: "${item.primaryKeyword}"
- AUDIENCE: ${item.audience}
- ANGLE: ${item.angle}
- FEATURED PROTOCOL: ${item.protocol || 'a clear named method'}
- RECOMMENDED BOOK to mention once: "${item.book}" by Giannis Notaras
- INTERNAL LINKS to include (markdown, descriptive anchors): ${links || '(none)'}`;
}

async function groqComplete(messages) {
  let lastErr;
  for (const model of MODELS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 3600 }),
      });
      if (!res.ok) {
        lastErr = new Error(`${model}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
        continue;
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text && text.trim()) return text;
      lastErr = new Error(`${model}: empty response`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error('all models failed');
}

function stripEmDashes(s) {
  return s.replace(/\s*\u2014\s*/g, ', ');
}

function parseArticle(raw) {
  let text = raw.trim();
  // Drop a wrapping code fence if the model added one.
  text = text.replace(/^```(?:markdown|md)?\s*/i, '').replace(/```\s*$/, '').trim();

  const [beforeDesc, afterDesc = ''] = text.split(/===\s*DESCRIPTION\s*===/i);
  const description = stripEmDashes(afterDesc.trim().split('\n')[0].trim());

  const [bodyPart, faqPart = ''] = beforeDesc.split(/===\s*FAQ\s*===/i);
  let body = bodyPart.trim().replace(/^#\s+.*\n+/, '').trim(); // drop a stray H1
  body = stripEmDashes(body);

  const faq = [];
  let q = null;
  for (const line of faqPart.split('\n')) {
    const qm = line.match(/^\s*Q:\s*(.+)/i);
    const am = line.match(/^\s*A:\s*(.+)/i);
    if (qm) q = stripEmDashes(qm[1].trim());
    else if (am && q) {
      faq.push({ q, a: stripEmDashes(am[1].trim()) });
      q = null;
    }
  }
  return { body, faq, description };
}

function dedupe(arr) {
  return [...new Set(arr.filter(Boolean))];
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
  const posts = raw.posts || [];
  const today = new Date().toISOString().slice(0, 10);

  const pending = posts.filter(
    (p) => p.status !== 'published' && !fs.existsSync(path.join(ARTICLES_DIR, `${p.slug}.md`)),
  );

  if (pending.length === 0) {
    console.log('Queue has no pending topics. Nothing to generate.');
    return;
  }

  const hasKey = !!process.env.GROQ_API_KEY;
  const hasPrewritten = pending.some((p) => p.body);
  if (!hasKey && !hasPrewritten) {
    console.log(
      'GROQ_API_KEY not set and no pre-written items. Skipping generation (no-op).\n' +
        'Add GROQ_API_KEY as a repo secret (free at console.groq.com) to activate the auto-blog.',
    );
    return;
  }

  let generated = 0;
  for (const item of pending) {
    if (generated >= PER_RUN) break;
    try {
      let parsed;
      if (item.body) {
        parsed = {
          body: stripEmDashes(item.body.trim()),
          faq: item.faq || [],
          description: item.description || item.title,
        };
      } else {
        if (!hasKey) continue; // can't generate this one without a key; leave pending
        console.log(`Generating: ${item.slug} ...`);
        const out = await groqComplete([
          { role: 'system', content: STYLE },
          { role: 'user', content: buildUserPrompt(item) },
        ]);
        parsed = parseArticle(out);
      }

      // Quality gate: never publish thin or malformed output.
      if (parsed.body.length < 600 || parsed.faq.length < 2 || !parsed.description) {
        console.warn(`Skipping ${item.slug}: failed quality gate (len=${parsed.body.length}, faq=${parsed.faq.length}).`);
        continue;
      }

      const frontmatter = {
        title: item.title,
        description: parsed.description.slice(0, 200),
        date: today,
        tags: item.tags || [],
        keywords: dedupe([item.primaryKeyword, ...(item.tags || [])]),
        faq: parsed.faq.slice(0, 6),
      };

      const file = matter.stringify(`\n${parsed.body}\n`, frontmatter);
      fs.writeFileSync(path.join(ARTICLES_DIR, `${item.slug}.md`), file, 'utf8');

      // Also emit a short-form video script for the social firehose. Best-effort:
      // a failed short must never block the article that already wrote.
      if (hasKey) {
        try {
          const shortRaw = await groqComplete([
            { role: 'system', content: SHORT_STYLE },
            { role: 'user', content: `TITLE: ${item.title}\nAUDIENCE: ${item.audience || 'athletes'}\nARTICLE:\n${parsed.body.slice(0, 1400)}` },
          ]);
          const short = stripEmDashes(
            shortRaw.trim().replace(/^```(?:markdown|md)?\s*/i, '').replace(/```\s*$/, '').trim(),
          );
          fs.mkdirSync(SHORTS_DIR, { recursive: true });
          fs.writeFileSync(path.join(SHORTS_DIR, `${item.slug}.md`), short + '\n', 'utf8');
          console.log(`  wrote content-pipeline/shorts/${item.slug}.md`);
        } catch (e) {
          console.warn(`  short script skipped for ${item.slug}: ${e.message}`);
        }
      }

      item.status = 'published';
      item.publishedDate = today;
      generated += 1;
      console.log(`  wrote src/content/articles/${item.slug}.md`);
    } catch (e) {
      console.warn(`  failed ${item.slug}: ${e.message}`);
    }
  }

  fs.writeFileSync(QUEUE_PATH, JSON.stringify(raw, null, 2) + '\n', 'utf8');
  console.log(`Done. Generated ${generated} article(s).`);
}

main().catch((e) => {
  console.error('generate.mjs fatal:', e);
  process.exit(1);
});
