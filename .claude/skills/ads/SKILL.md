---
name: ads
description: Use when running or troubleshooting paid ad campaigns on Meta, Google, or TikTok — setting up account/campaign structure, targeting, budgets, bid strategy, the testing cadence, or when CAC/ROAS is off, spend isn't scaling, or learning phase keeps resetting.
---

# Paid Ads

## Overview
Modern ad platforms optimize delivery for you — your job is feeding the algorithm a clean structure, enough budget per ad set to exit the learning phase, and a steady stream of creative to test. Creative and offer drive results far more than micro-targeting.

## Framework
1. **Foundation**: install pixel/conversions API, define one primary conversion event, set up server-side tracking. Bad tracking = bad optimization.
2. **Structure**: few campaigns, consolidated ad sets (CBO/Advantage+ on Meta). Don't fragment budget across many tiny ad sets — it starves the learning phase.
3. **Targeting**: start broad and let the algorithm find buyers; layer interests only if broad underperforms. Exclude existing customers on prospecting.
4. **Creative testing**: test distinct hooks/angles, not tweaks. 3-5 concepts per cycle; kill losers, scale winners.
5. **Budget/bid**: start with cost cap or lowest-cost; scale winners ~20% every few days to avoid resetting learning.
6. **Measure**: judge on CAC/ROAS and blended/MER, not platform-reported ROAS alone.

## Quick Reference
| Platform | Strength | Default play |
|---|---|---|
| Meta | Demand gen, broad reach | Advantage+ / broad + strong UGC creative |
| Google Search | High-intent capture | Exact/phrase keywords, bottom-funnel |
| Google PMax/Shopping | Ecommerce intent | Feed quality + asset groups |
| TikTok | Cheap reach, discovery | Native UGC, trends, Spark Ads |

**Learning phase:** ~50 conversions/ad set/week to exit. Don't edit ad sets mid-learning.

## Common Mistakes
- Over-segmenting: too many ad sets splitting budget so none exits learning.
- Editing active ad sets constantly, resetting the learning phase.
- Narrow targeting when broad + good creative now wins on Meta/TikTok.
- Judging on last-click platform ROAS instead of blended CAC/MER.
- Scaling too fast (doubling budgets) and crashing performance.
- Running Search and Shopping logic identically — intent differs.
- No creative pipeline — winners fatigue and CPMs climb with nothing to replace them.
- Killing ads before statistical signal, or after one bad day.
