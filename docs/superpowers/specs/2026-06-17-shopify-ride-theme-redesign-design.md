# Shopify Live Storefront Redesign (Horizon → Ride) — Design

**Date:** 2026-06-17
**Status:** Approved by owner ("autonomously according to other winning Shopify
shops"). Blocked on one manual step (theme install) before implementation can
start — see §5.
**Owner ask:** Change the live Shopify storefront away from its default theme.
Standing sales mandate applies (use all means necessary to drive sales).

## 0. Why this project exists

This session's earlier redesign work (homepage, book pages, course page, blog)
was built in this repo's Next.js app under the assumption it would become
`thementalsport.com`. It was confirmed this session that it does not — the
domain is fully owned by a live Shopify store (`get-shop-info` returns
`domain: "thementalsport.com"` directly), which has real, active, priced
products and a live blog (55 imported articles) sitting on Shopify's unstyled
default theme, **Horizon**. None of the Next.js work has reached a real
customer. This project moves the conversion-focused design effort to the
surface that actually serves customers.

## 1. Goal

Replace Horizon with a theme suited to the niche, then rebuild the storefront
so it doesn't read as "a page with a list of books" (owner's words from
earlier feedback on the same underlying problem, raised before the Shopify
discovery). Drive sales per the standing mandate.

### Why this is urgent, not cosmetic (analytics, queried 2026-06-17)

Checked via `run-analytics-query`, SINCE -365d UNTIL today (2025-06-17 to
2026-06-17):

- **Lifetime revenue: $297, from exactly 1 completed order** (June 2026, for
  "The Mental Performance Protocol Course"). Zero books have ever sold.
- **Traffic is real and growing**: 445 sessions trailing year, 88% of it
  (390 sessions) landed in May+June 2026 — coinciding with the blog import
  and the broader multi-channel marketing push this project has been running.
  Nov 2025–Jan 2026 had a small trickle (28/25/2 sessions); Feb–Apr 2026 had
  zero.
- **Funnel is the leak, not traffic**: June 2026 = 239 sessions → 5 reached
  checkout → 1 completed (0.42% conversion). May 2026 = 151 sessions → 1
  reached checkout → 0 completed (0%). Typical ecommerce benchmarks run
  1-3% — this store is converting at a fraction of that.

Conclusion: people are now arriving (marketing is working), and almost none
of them buy. That's a storefront-design problem, which is exactly what this
project addresses. No data exists yet on which product converts best
(n=1) — see §3 spotlight decision.

## 2. Theme decision

Evaluated against two real comps found via research (Daily Stoic Store —
same shape: single nonfiction author, multiple editions, serious aesthetic;
Peak Performance Sports — direct niche competitor, but dated/legacy feeling —
a "don't look like this" example) and three free Shopify Theme Store
candidates:

| Theme | Verdict |
|---|---|
| Dawn | Safe, proven, but generic — no built-in personality |
| Studio | Bold/gallery layout, but built for artists/makers — aesthetic mismatch |
| **Ride** | **Chosen.** Purpose-built for sports/performance brands: dark backdrops, accent-hue support, asymmetric layouts, video support, free |

Budget constraint from owner: free themes only (ruled out paid options like
Pipeline/Satoshi).

Caveat: research was done via `WebSearch` only. This sandbox's network egress
blocks `WebFetch` to all external hosts (confirmed broadly, not just
thementalsport.com), so no comp site was visually inspected firsthand —
findings are from search-result summaries and theme-store descriptions.

## 3. Design direction

- **Color scheme:** dark background, off-white text, red accent — carries
  over the brand direction already chosen (but unused) in the Next.js
  redesign. Implemented as one of Ride's built-in color-scheme slots, not
  custom code.
- **Typography:** Ride's bold/heavy display type for headlines — fits a
  performance/intensity brand better than anything soft.
- **Homepage:** dark full-width hero (headline + subhead + one clear CTA,
  not generic demo copy) → one spotlighted/larger featured book using Ride's
  asymmetric section capability → rest of the 8-book catalog in a tighter
  grid below (this replaces the flat list) → a blog teaser section surfacing
  the 55 already-live "Mental Performance" articles, currently orphaned with
  no link from the storefront.
- **Collection page:** lean on cover art + Ride's grid/filter components.
- **Product pages:** Ride's standard template to start (title, price,
  description, image). No custom video sections this pass — flagged as a
  possible future add-on, not in scope now.
- **Catalog cleanup:** the stale archived duplicate product ("The Mental
  Performance Protocol", $297, ARCHIVED) is left untouched per owner
  decision — it's invisible to customers already, not worth the risk/effort.
  The empty "Новини" blog is likewise left alone (zero customer impact).

Beyond this direction, the owner has granted autonomy to make detailed
section/copy/layout decisions by modeling what other winning Shopify stores
in adjacent niches do — no further sign-off needed on individual choices.

## 4. What still requires an explicit checkpoint

Per standing instruction, public-facing visual changes need approval before
they go live. The autonomy grant above covers *drafting* the new design.
**Publishing Ride over Horizon (the actual customer-facing cutover) still
gets one explicit go/no-go from the owner**, after the draft is built and
previewable. Horizon stays installed (unpublished) after the swap, so
reverting is a single `themePublish` call if anything's wrong.

## 5. Mechanics / sequencing

1. **Manual step, owner-only — blocking.** Shopify's Theme Store "Add theme"
   action is not exposed via the Admin API (confirmed: no mutation installs a
   theme by Theme Store ID/name; `themeCreate` only accepts a public ZIP URL
   for custom-coded themes, and Ride is not open-sourced). The owner must:
   Shopify Admin → Online Store → Themes → "Visit Theme Store" → search
   "Ride" → Add theme. Installs as an unpublished draft; does not touch the
   live site. **As of this doc, Ride has not yet been added** (verified via
   `themes(first: 20)` — only Horizon exists).
2. Once Ride exists in the theme library, customize it via the Admin GraphQL
   API (`themeFilesUpsert` for section/template/settings JSON edits) entirely
   as an unpublished draft.
3. Preview the draft (Shopify gives unpublished themes a preview URL on the
   `myshopify.com` domain — untested yet whether this sandbox's egress allows
   reaching it; may need owner-side screenshots again like the earlier
   verification workaround this session).
4. Get explicit go-ahead, then `themePublish` to make Ride the live theme.

## 6. Open / deferred

- Exact homepage copy and which book gets the "spotlighted" slot — decided
  during implementation per the autonomy grant, not pre-specified here.
- Whether the duplicate archived product or "Новини" blog get cleaned up —
  explicitly deferred (owner: leave them).
