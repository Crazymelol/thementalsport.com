---
name: swift-review
description: Use when reviewing or writing Swift code, or when seeing Swift issues like force-unwrap crashes, retain cycles/memory leaks, value-vs-reference confusion, unhandled errors, or protocol/generics design problems.
---

# Swift Review

## Overview
Reference for catching Swift-specific optional, memory, and value-semantics issues during review.

## Quick Reference

| Pitfall | Bad | Good |
|---|---|---|
| Force unwrap | `x!` | `if let` / `guard let` / `??` |
| Force try | `try!` | `do/catch` or `try?` |
| Retain cycle | capture `self` in closure | `[weak self]` / `[unowned self]` |
| Reference where value fits | `class Point` | `struct Point` |
| IUO overuse | `var x: T!` | real optional |
| Ignored error | `try? f()` discarding | handle the error |

## Key Points

- **Optionals**: unwrap with `guard let`/`if let`/`??`; avoid `!` except for documented invariants. Implicitly-unwrapped optionals (`T!`) are landmines outside `@IBOutlet`.
- **Value vs reference**: `struct`/`enum` are copied (value semantics—safer, thread-friendly); `class` is shared by reference. Prefer `struct` for models; reach for `class` only for identity/inheritance/Obj-C interop. Watch for unintended sharing via `class` inside a struct.
- **ARC / retain cycles**: closures capture `self` strongly by default. Use `[weak self]` (then `guard let self else { return }`) for escaping closures, delegates (`weak var delegate`), and parent↔child references. `unowned` only when lifetime is guaranteed.
- **Error handling**: use `throws`/`do-catch`; `try?` for optional-on-error, `try!` only when failure is impossible. Don't swallow errors silently.
- **Protocols**: program to protocols; use protocol extensions for default impls, associated types/generics for type-safe abstractions. Beware protocol-with-`Self`/associatedtype can't be used as an existential pre-Swift 5.7.

```swift
guard let user = fetchUser() else { return }   // no force unwrap
resource.onDone { [weak self] in self?.refresh() }
```

## Common Mistakes

- `[unowned self]` where the object can deinit first (crash).
- Mutating a `struct` captured by value and expecting the original to change.
- Strong `delegate` references causing leaks.
- Comparing floating-point with `==`.
- Heavy work on the main thread / UI updates off the main thread.
- Force-casting with `as!` instead of `as?` + `guard`.
