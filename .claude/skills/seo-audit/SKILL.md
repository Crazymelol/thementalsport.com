---
name: seo-audit
description: Use when auditing a page or site for SEO problems — diagnosing why pages don't rank, reviewing on-page/technical/content SEO, or producing a prioritized list of fixes before publishing or after a traffic drop.
---

# SEO Audit

## Overview

A repeatable, prioritized audit. Work top-down: technical issues that block indexing first, then on-page relevance, then content/authority. A page that can't be crawled can't rank no matter how good the copy is.

**Core principle:** Fix what blocks ranking before optimizing what improves it. Order matters more than completeness.

## Audit Layers (in priority order)

**1. Crawl & Index**
- `robots.txt` not blocking, no stray `noindex`, canonical points to self (or correct URL)
- In sitemap.xml; reachable within ~3 clicks of home
- Returns 200 (not soft-404 / redirect chains)

**2. Core Web Vitals & Technical**
- LCP < 2.5s, CLS < 0.1, INP < 200ms
- Mobile-friendly, HTTPS, no mixed content
- Structured data valid (see `schema` skill if present)

**3. On-Page Relevance**
- One clear primary keyword/intent per page; title (<60 chars) and H1 contain it
- Meta description written for clicks (not keyword stuffing)
- URL short and descriptive; headings form a logical outline
- Internal links in with descriptive anchor text
- Images have alt text

**4. Content Quality & Intent Match**
- Does the page match search *intent* (informational vs transactional)?
- Covers the topic more completely than the pages currently ranking
- Demonstrates first-hand experience/expertise (E-E-A-T)
- Not thin, not duplicated across the site

## Output Format

Deliver a table, sorted by impact × effort:

| Priority | Issue | Page(s) | Fix | Why it matters |
|---|---|---|---|---|

Lead with the 3–5 highest-leverage fixes. Don't bury a `noindex` blocker under a list of alt-text nits.

## Common Mistakes

- Auditing copy on a page Google can't index — check crawlability first.
- Reporting 50 equal-weight issues with no prioritization.
- Targeting a keyword whose intent the page doesn't satisfy (e.g. a product page for an informational query).
- Ignoring what currently ranks — the bar is "beat page 1," not "be good."
