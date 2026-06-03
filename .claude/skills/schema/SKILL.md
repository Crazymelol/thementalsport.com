---
name: schema
description: Use when adding or debugging structured data / JSON-LD schema markup — Product, FAQ, Article, Breadcrumb, Organization, Review, HowTo — to win rich results, or when Search Console reports structured-data errors or missing rich snippets.
---

# Schema / Structured Data (JSON-LD)

## Overview
Schema.org markup in JSON-LD tells search and AI engines what your content means, unlocking rich results. Mark up only what is visibly on the page; mismatches cause penalties.

## Framework
1. **Pick types** by page: product page → `Product` + `Offer` + `AggregateRating`; help/FAQ → `FAQPage`; blog → `Article`; any page → `BreadcrumbList`; site-wide → `Organization` + `WebSite`.
2. **Use JSON-LD** in a `<script type="application/ld+json">` in `<head>` — Google's preferred format over microdata/RDFa.
3. **Fill required + recommended fields** (e.g., Product needs name, image, offers.price, priceCurrency, availability).
4. **Connect entities** with `@id` references and `sameAs` links to social/Wikidata.
5. **Validate** with the Rich Results Test and Schema Markup Validator before shipping; monitor Search Console > Enhancements.

## Quick Reference
| Page | Schema | Key fields |
|------|--------|-----------|
| Product | Product/Offer | name, image, price, priceCurrency, availability, aggregateRating |
| FAQ | FAQPage | mainEntity[].question/acceptedAnswer |
| Article | Article/BlogPosting | headline, author, datePublished, image |
| Nav path | BreadcrumbList | itemListElement[].position/name/item |
| Brand | Organization | name, url, logo, sameAs |

## Common Mistakes
- Marking up content not visible to users (against guidelines → manual action).
- Fake or sitewide-templated review/FAQ markup.
- Missing required fields (price, image) so no rich result shows.
- Invalid JSON (trailing commas, unescaped quotes) breaking the whole block.
- Multiple conflicting blocks or wrong `@type`.
- Never validating or monitoring Search Console after deploy.
- Using FAQPage where Google has restricted it (now limited to authoritative sites).
