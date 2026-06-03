---
name: go-review
description: Use when reviewing or writing Go code, or when seeing Go issues like ignored errors, goroutine leaks, nil interface comparisons, defer in loops, slice aliasing/append surprises, or missing context propagation.
---

# Go Review

## Overview
Reference for catching Go-specific concurrency and error-handling bugs during review.

## Quick Reference

| Pitfall | Bad | Good |
|---|---|---|
| Ignored error | `v, _ := f()` | check `if err != nil` |
| Wrapped error | `fmt.Errorf("%v", err)` | `fmt.Errorf("...: %w", err)` |
| defer in loop | `for { defer f.Close() }` | close per-iter or extract func |
| Goroutine leak | send on unread chan | use `context`/buffered/`select` |
| Loop var capture (<1.22) | `go func(){ use(i) }()` | pass `i` as arg |
| nil interface | `return err` (typed nil) | return untyped `nil` |

## Key Points

- **Errors are values**: never discard with `_` unless intentional and commented. Wrap with `%w` to preserve the chain; inspect with `errors.Is`/`errors.As`. Add context at each layer, don't double-log.
- **Goroutine leaks**: every goroutine needs a guaranteed exit path. A goroutine blocked sending to a channel nobody reads leaks forever. Use `context.Context` cancellation, buffered channels, or `select` with `<-ctx.Done()`.
- **nil interface gotcha**: a non-nil interface holding a nil pointer is `!= nil`:

```go
var p *MyErr = nil
var err error = p   // err != nil  (has a type!)
```
Return a literal `nil`, not a typed nil pointer.

- **Slices alias**: `append` may mutate the backing array shared with another slice; `b := a[:2]; append(b, x)` can clobber `a[2]`. Copy or use full-slice `a[low:high:max]` to cap capacity.
- **defer**: runs at function return, not block end—don't `defer` inside loops over many items. Args are evaluated immediately.
- **context**: pass `ctx` as the first param through call chains; don't store it in structs. Respect cancellation/deadlines.
- Protect shared state with mutexes or channels; run tests with `-race`.

## Common Mistakes

- Forgetting to call `wg.Done()` (deadlock) or calling it twice (panic).
- Closing a channel from the receiver side, or closing twice (panic).
- Range-copying large structs; iterate by index for big elements.
- Map access assumed present—use the `v, ok := m[k]` form.
- Not setting timeouts on `http.Client`/server.
