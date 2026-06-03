---
name: rust-review
description: Use when reviewing or writing Rust code, or when seeing Rust issues like borrow-checker fights, lifetime errors, unwrap/expect panics, excessive clone(), Result/Option misuse, or trait/generic bound problems.
---

# Rust Review

## Overview
Reference for catching Rust-specific ownership, error-handling, and idiom issues during review.

## Quick Reference

| Pitfall | Bad | Good |
|---|---|---|
| Panic on None | `opt.unwrap()` | `?` / `match` / `unwrap_or` |
| Clone to dodge borrow | `x.clone()` | borrow `&x` / restructure |
| Stringly errors | `Err("msg".into())` | typed error / `thiserror` |
| `&Vec<T>`/`&String` params | `fn f(v: &Vec<T>)` | `fn f(v: &[T])` / `&str` |
| Ignored Result | `let _ = f();` | handle or `?` |
| Index panic | `v[i]` | `v.get(i)` |

## Key Points

- **Ownership/borrowing**: one `&mut` XOR many `&`. Fighting the borrow checker usually signals a design issue—split structs, narrow borrow scopes, or return owned data rather than slapping `.clone()` everywhere.
- **Lifetimes**: elision covers most cases; explicit `'a` is needed when a returned reference borrows from an input. "Does not live long enough" means a borrow outlives its owner—restructure ownership, don't reach for `'static`.
- **Result/Option**: propagate with `?`; combinators `map`, `and_then`, `ok_or`, `unwrap_or_else`. Reserve `unwrap`/`expect` for tests, prototypes, or proven invariants (document why).
- **Clone overuse**: a `.clone()` to silence the borrow checker is a smell. Prefer borrowing, `Cow<'_, T>`, `Rc`/`Arc` for shared ownership, or `mem::take`.
- **Traits**: prefer generics `fn f<T: Trait>(t: T)` (static dispatch) over `Box<dyn Trait>` unless heterogeneity/object-safety is needed. Use `impl Trait` for returns.

```rust
let val = map.get(&key).ok_or(Error::Missing)?;  // no panic, propagates
```

## Common Mistakes

- `unwrap()` in library/production paths instead of returning `Result`.
- Holding a `RefCell`/`Mutex` borrow across an `.await` or while re-borrowing (panic/deadlock).
- Returning references to local data ("cannot return reference to temporary").
- Integer overflow assumptions—release mode wraps; use `checked_*`/`saturating_*`.
- Overusing `Rc<RefCell<T>>` to model graphs instead of indices/arenas.
- `.collect()` into the wrong type or unnecessarily where an iterator would do.
