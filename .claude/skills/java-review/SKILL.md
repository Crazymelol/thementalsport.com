---
name: java-review
description: Use when reviewing or writing Java code, or when seeing Java issues like NullPointerException, broken equals/hashCode, stream misuse, unclosed resources, or unsafe concurrency/shared mutable state.
---

# Java Review

## Overview
Reference for catching Java-specific null, equality, resource, and concurrency issues during review.

## Quick Reference

| Pitfall | Bad | Good |
|---|---|---|
| NPE | `s.equals("x")` | `"x".equals(s)` / `Objects.equals` |
| equals w/o hashCode | override one only | override both |
| Resource leak | manual `close()` | try-with-resources |
| Optional misuse | `opt.get()` | `opt.orElse`/`map`/`ifPresent` |
| Mutable static | shared `static` field | immutable / synchronized |
| `==` on objects | `a == b` | `a.equals(b)` |

## Key Points

- **Null**: prefer `Objects.requireNonNull` at boundaries, `Optional<T>` for return values that may be absent (never for fields/params). Call `.equals` on the known-non-null literal.
- **equals/hashCode**: always override together and keep them consistent, or `HashMap`/`HashSet` break. Use `Objects.equals`/`Objects.hash`. Records auto-generate correct ones.
- **Streams**: don't reuse a consumed stream; avoid side effects in `map`/`filter` (use `forEach` for effects). Beware boxed-primitive overhead—use `IntStream`/`mapToInt`. Don't replace a simple loop with an unreadable stream chain.
- **Resources**: anything `AutoCloseable` (streams, JDBC, sockets) goes in try-with-resources so it closes on exceptions too.
- **Concurrency**: shared mutable state needs `synchronized`, `java.util.concurrent` (`ConcurrentHashMap`, `AtomicInteger`), or immutability. `volatile` gives visibility, not atomicity. Prefer `ExecutorService` over raw threads; always shut it down.

```java
try (var in = Files.newInputStream(path)) {   // auto-closed
    return in.readAllBytes();
}
```

## Common Mistakes

- Autoboxing NPE: unboxing a `null` `Integer` into an `int`.
- Catching `Exception`/`Throwable` and swallowing it.
- Modifying a collection while iterating (`ConcurrentModificationException`)—use `Iterator.remove` or `removeIf`.
- Returning `null` collections instead of `Collections.emptyList()`.
- `String` concatenation in loops instead of `StringBuilder`.
- Non-static inner classes leaking the outer instance.
- `Optional` fields or parameters (anti-pattern).
