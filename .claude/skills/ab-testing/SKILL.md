---
name: ab-testing
description: Use when designing or analyzing an A/B or split test — forming a hypothesis, calculating sample size and statistical significance, deciding when to stop, or when results look ambiguous and you suspect peeking or underpowered tests.
---

# A/B Testing

## Overview
A valid test isolates one variable, runs to a pre-computed sample size, and is judged once at the end. Stopping early or testing many things at once produces false wins.

## Framework
1. **Hypothesis** — "Changing X to Y will improve [metric] because [reason]." Define one primary metric up front.
2. **One variable** — change a single element so any lift is attributable. (Use multivariate only with heavy traffic.)
3. **Sample size** — compute before launch from baseline rate, minimum detectable effect, power (80%), and significance (95%). Underpowered tests are worthless.
4. **Run full cycles** — at least 1-2 weeks covering weekday/weekend; don't stop on day 2.
5. **Don't peek** — checking repeatedly and stopping on significance inflates false positives. Decide at the planned endpoint (or use sequential/Bayesian methods designed for it).
6. **Analyze** — confirm significance, check segments, watch for novelty effects, then ship or iterate.

## Quick Reference
| Term | Meaning |
|------|---------|
| MDE | Smallest lift worth detecting |
| Power | Chance of detecting a real effect (aim 80%) |
| Significance | p<0.05 / 95% confidence |
| Sample size | Pre-computed from baseline, MDE, power |
| Peeking | Repeated early checks → false positives |

## Common Mistakes
- Calling a winner before reaching sample size (peeking).
- Underpowered test → "no difference" that's really no data.
- Changing multiple elements, so you can't tell what worked.
- Ignoring seasonality / running less than a full week.
- Testing trivial changes with no hypothesis.
- Ignoring practical significance — a 0.1% lift may not be worth it.
- Not accounting for multiple comparisons across many variants.
