---
name: build-fix
description: Use when a build or CI pipeline is broken or failing — compile errors, failed installs, dependency/version conflicts, red CI, "works on my machine" discrepancies, or stale-cache failures that need diagnosis and a fix.
---

# Build Fix

## Overview
Systematic approach to diagnosing and fixing broken builds and CI. The core discipline: read the FIRST real error, reproduce it locally, then fix root cause — not the noise that follows it.

## Quick Reference

| Step | Action |
|---|---|
| 1. First error | Scroll to the FIRST error, not the last. Later errors are usually fallout. |
| 2. Read it literally | File, line, exact message. Don't guess. |
| 3. Reproduce locally | Same command CI runs, same node/python/etc version. |
| 4. Isolate | Did it just break? `git bisect` / diff against last green. |
| 5. Categorize | Code error vs dependency vs cache vs env vs flaky. |
| 6. Fix root cause | Then re-run the full build clean. |

## Diagnosing by category
- **Dependency/version conflict**: lockfile drift, transitive version clash, peer-dep mismatch. Check `package-lock.json`/`yarn.lock`/`poetry.lock`/`go.sum`. Regenerate lockfile, pin versions, match CI's runtime version.
- **Cache issues**: stale build cache, incremental artifacts. Try a clean build (`rm -rf node_modules dist`, `--no-cache`, clear CI cache) to confirm.
- **Environment differences**: missing env var, different OS/arch, tool version mismatch. Compare CI runner versions to local.
- **Flaky/timeout**: re-run once to confirm non-determinism; don't "fix" by retrying — find the race/timeout.

## Common Mistakes
- **Reading the last error** instead of the first — the build aborts and cascades.
- **Fixing locally without reproducing the CI failure** — different versions/env mean you fix the wrong thing.
- **Blindly bumping/downgrading deps** until green — introduces silent breakage. Understand the conflict.
- **Clearing cache as a permanent fix** — masks a real non-reproducible build; fix determinism.
- **Ignoring warnings** that CI treats as errors (`-Werror`, `CI=true` strict mode).
- **Not pinning the toolchain version** so CI and local drift again.
- **Committing the fix without re-running the full pipeline** clean from scratch.

## Workflow
1. Capture full log; find first error. 2. Reproduce with CI's exact command + version. 3. Bisect if regression. 4. Fix root cause. 5. Clean rebuild locally. 6. Push and confirm CI green.
