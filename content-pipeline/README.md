# Auto-Blog Pipeline

Publishes SEO articles to the blog on a schedule, pulling from a topic queue.
Built to run entirely inside GitHub Actions (the sandbox has no outbound
internet), so it costs nothing and needs no local setup.

## How it works

1. **`queue.json`** holds a list of topic briefs (`posts[]`). Each brief has a
   `slug`, `title`, `primaryKeyword`, `angle`, `book`, `tags`, `internalLinks`,
   and a `status` (`pending` until published).
2. **`scripts/blog/generate.mjs`** takes the next `POSTS_PER_RUN` pending briefs,
   asks Groq (free, OpenAI-compatible) to write each one following the brand's
   voice + anti-AI-slop rules, and writes a full article to
   `src/content/articles/<slug>.md` dated that day. A quality gate rejects thin
   or malformed output. Items are marked `published` in the queue.
3. **`.github/workflows/blog-autopublish.yml`** runs the generator on a cron,
   commits the new article(s), then rebuilds and redeploys the static site.

The blog library already turns each `.md` into a page with `BlogPosting` +
`FAQPage` + `BreadcrumbList` JSON-LD, a visible FAQ, canonical + OpenGraph tags,
and a book/course CTA chosen from the article's tags. So a queued brief becomes
a fully SEO-optimized, monetized page with no extra work.

## Activation (one step)

Add a repo secret **`GROQ_API_KEY`** (free key from <https://console.groq.com>).
Until it's set, the workflow runs but does nothing (clean no-op, green build) so
it never spams the site with junk before you've opted in.

- **Cadence:** edit the `cron` in `blog-autopublish.yml` (default: 2 posts/day).
- **Manual run / backfill:** Actions tab → *Blog Auto-Publish* → *Run workflow*,
  set `count` to generate several at once.

## Editing the queue

- Add briefs to `posts[]`. Keep each `slug` unique and not matching an existing
  article in `src/content/articles/`.
- Choose `tags` deliberately: they pick the book CTA (see `pickBook` in
  `src/lib/blog.ts`) and the on-page category.
- To publish a **hand-written** article on the drip instead of generating one,
  give the item a `body` (markdown), optional `faq` (`[{q,a}]`), and
  `description`. It ships verbatim with no model call.

## Quality & safety

- Anti-AI-writing rules are baked into the generator prompt (no em dashes, no
  filler words, human voice), and a post-process strips any stray em dashes.
- The generator only references established, real concepts and is told never to
  fabricate statistics or studies.
- Nothing publishes if the output is too short or missing its FAQ/description.
