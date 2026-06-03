---
name: kotlin-review
description: Use when reviewing or writing Kotlin code, or when seeing Kotlin issues like nullability/!! crashes, coroutine scope/cancellation bugs, data class copy/equals surprises, misused scope functions, or non-exhaustive sealed-class when.
---

# Kotlin Review

## Overview
Reference for catching Kotlin-specific null-safety, coroutine, and idiom issues during review.

## Quick Reference

| Pitfall | Bad | Good |
|---|---|---|
| Force unwrap | `x!!.foo` | `x?.foo` / `?:` / smart-cast |
| Platform type NPE | trust Java `String` | annotate / null-check |
| GlobalScope | `GlobalScope.launch` | structured `coroutineScope`/`viewModelScope` |
| Swallow cancel | `catch (e: Exception)` | rethrow `CancellationException` |
| Non-exhaustive when | missing branch | `when` over sealed (no else) |
| Mutable data class | `var` fields | `val` + `copy()` |

## Key Points

- **Null safety**: prefer `?.`, `?:` (elvis), and `let`/`also` over `!!`. Every `!!` is a potential NPE—justify it. Java interop yields *platform types* (`String!`) that bypass checks; null-check at the boundary.
- **Coroutines**: use structured concurrency—launch into a scope tied to a lifecycle (`viewModelScope`, `coroutineScope {}`), never `GlobalScope`. `CancellationException` must propagate; don't swallow it in a broad `catch`. Mark blocking calls with `withContext(Dispatchers.IO)`.
- **Data classes**: use `val` properties; mutate via `copy()`. Note `equals`/`hashCode`/`toString` cover only constructor params, not body properties.
- **Scope functions**: `let` (nullable transform), `apply` (configure, returns receiver), `also` (side effect), `run`/`with` (compute). Don't nest them deeply—it hurts readability.
- **Sealed classes/interfaces**: model finite states; `when` over a sealed type is exhaustive without `else`, so new variants cause compile errors (good).

```kotlin
val name = user?.name ?: "anonymous"   // no !!, no NPE
```

## Common Mistakes

- `lateinit var` accessed before init (`UninitializedPropertyAccessException`); prefer `by lazy` or nullable.
- Catching `Exception` inside a coroutine and eating cancellation.
- Equality on data classes with array properties (uses reference equality).
- Leaking `this` in `apply`/`run` lambdas.
- Using `companion object` constants where top-level `const val` is cleaner.
- Overusing `!!` after a null check the compiler already smart-casts.
