---
name: flutter-review
description: Use when reviewing or writing Flutter/Dart code, or when seeing Flutter issues like excessive widget rebuilds, setState misuse, missing/wrong keys, async FutureBuilder bugs, BuildContext-after-await crashes, or unclear state management.
---

# Flutter Review

## Overview
Reference for catching Flutter/Dart-specific bugs and idioms. Focus on the rebuild lifecycle, state management, keys, and async-context safety.

## Quick Reference

| Pitfall | Bad | Good |
|---|---|---|
| Heavy rebuilds | huge build() | small `const` widgets, split widgets |
| setState misuse | in build/loop | only for local ephemeral state |
| Future rebuilt | `FutureBuilder(future: fetch())` | cache future in `initState` |
| Context after await | `Navigator...` post-await | check `if (!mounted) return;` |
| Missing key | reordered list items | `Key`/`ValueKey` for identity |
| Leaked controller | no dispose | `dispose()` controllers/streams |

## Idioms
- Mark static subtrees `const` so they're skipped on rebuild. Keep `build()` cheap and side-effect free.
- `setState` only for local, ephemeral widget state; lift app state into a state-management solution (Provider, Riverpod, Bloc).
- Store `Future`/`Stream` in `initState` (or a notifier), don't create it inside `build` — `FutureBuilder` would re-run it every rebuild.
- Use `ValueKey`/`ObjectKey` when widget identity matters (reordering, animating lists) and `GlobalKey` sparingly.
- Dispose `AnimationController`, `TextEditingController`, `StreamSubscription`, focus nodes in `dispose()`.

## Common Mistakes
- **Using `BuildContext` across an `await`** — after the gap the widget may be unmounted: guard with `if (!mounted) return;`.
- **Calling `setState` after dispose** or during build → exceptions; or calling it for state that should live elsewhere.
- **Building the future/stream inline** in `FutureBuilder`/`StreamBuilder` causing refetch storms.
- **Missing or wrong keys** in lists — state attaches to the wrong item on reorder/insert.
- **Rebuilding the whole tree** instead of scoping rebuilds (no `const`, monolithic widgets, `Provider` without `Consumer`/`select`).
- **Not disposing controllers/subscriptions** — memory leaks.
- **Expensive work in `build()`** (network, parsing, allocation) — runs every frame.
- **Unbounded/unconstrained layout** errors ("RenderFlex overflowed", "unbounded height").
- **Ignoring `async` errors** / unhandled `Future` rejections.
- **Mutating state directly** instead of through the state manager.
