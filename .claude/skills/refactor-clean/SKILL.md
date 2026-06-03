---
name: refactor-clean
description: Use when restructuring or cleaning up code without changing behavior — extracting functions, renaming, reducing duplication or complexity, untangling a large function/class, or when a change feels risky and needs small safe steps with tests staying green.
---

# Refactor Clean

## Overview
Safe, incremental refactoring: improve structure while preserving behavior. The rule is one small, reversible step at a time, with tests green after each — never mix refactoring with behavior changes.

## Quick Reference

| Principle | Detail |
|---|---|
| Green before, green after | Tests pass before you start and after every step. |
| Small steps | One rename/extract at a time; commit each. |
| Behavior-preserving | No new features or bug fixes mid-refactor. |
| Characterize first | If no tests exist, add characterization tests. |
| Tool-assisted | Use IDE rename/extract — fewer manual errors. |
| Separate commits | Refactor commits distinct from feature commits. |

## Core moves
- **Extract function/method**: pull a cohesive block out, name it for intent.
- **Rename**: make names reveal intent; use automated rename.
- **Inline**: remove needless indirection.
- **Extract variable**: name a complex sub-expression.
- **Replace conditional with polymorphism / guard clauses**: flatten nesting.
- **Introduce parameter object / split large function**: reduce parameter count and complexity.
- **Dedup**: pull repeated logic into one place (only after you see it ~3 times).

## Workflow
1. Ensure tests exist and pass (add characterization tests if not). 2. Pick ONE small move. 3. Apply it. 4. Run tests. 5. Commit with a clear "refactor:" message. 6. Repeat. 7. If a test goes red, revert the last step — don't pile on.

## Common Mistakes
- **Big-bang rewrite** instead of incremental steps — hard to review, easy to break.
- **Mixing behavior changes into a refactor** — now you can't tell a bug from a restructure.
- **Refactoring without test coverage** — no safety net; add characterization tests first.
- **Premature abstraction / DRYing** two coincidentally-similar things into a wrong shared abstraction.
- **Letting tests stay red** across multiple steps.
- **Not committing between steps** — can't bisect or revert cleanly.
- **Renaming so broadly** that the diff is unreviewable — scope it.
- **Optimizing for cleverness** over readability; reducing complexity means fewer branches and clearer names, not denser code.
