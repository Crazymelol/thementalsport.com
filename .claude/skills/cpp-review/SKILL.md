---
name: cpp-review
description: Use when reviewing or writing C++ code, or when seeing C++ issues like manual new/delete, dangling references/iterators, undefined behavior, missing rule-of-3/5/0, raw owning pointers, or broken move semantics.
---

# C++ Review

## Overview
Reference for catching C++-specific memory, lifetime, and UB issues during review.

## Quick Reference

| Pitfall | Bad | Good |
|---|---|---|
| Manual memory | `new`/`delete` | `make_unique`/`make_shared` |
| Owning raw ptr | `Foo* own` | `unique_ptr<Foo>` |
| Custom dtor only | dtor w/o copy/move | rule of 5 (or =default/delete) |
| Dangling ref | return ref to local | return by value |
| C-cast | `(T)x` | `static_cast`/`dynamic_cast` |
| Index UB | `v[i]` OOB | `v.at(i)` / bounds-check |

## Key Points

- **RAII**: tie every resource (memory, file, lock, socket) to an object's lifetime; cleanup in the destructor. Prefer `std::lock_guard`/`std::scoped_lock` over manual lock/unlock.
- **Smart pointers**: `unique_ptr` for sole ownership (default), `shared_ptr` only for genuine shared ownership, `weak_ptr` to break cycles. Never `delete` a smart-pointer-managed object; avoid `new`.
- **Rule of 0/3/5**: prefer rule of 0 (own nothing manually, let members manage themselves). If you define a destructor, copy ctor, or copy assignment, you likely need all five (add move ctor/assignment), or `=default`/`=delete` them.
- **Move semantics**: `std::move` casts to rvalue—the moved-from object is valid-but-unspecified; don't use it after. Mark moves `noexcept` so containers use them. Don't `std::move` a return value of a local (defeats NRVO).
- **UB hotspots**: out-of-bounds access, signed overflow, use-after-free, uninitialized reads, data races, dereferencing null, invalidated iterators. Build with sanitizers (`-fsanitize=address,undefined`) and `-Wall -Wextra`.

```cpp
auto p = std::make_unique<Widget>();   // exception-safe, no leak
std::lock_guard lock(mtx_);            // RAII unlock
```

## Common Mistakes

- Returning a reference/pointer to a local or to a `std::string::c_str()` of a temporary.
- Iterator/reference invalidation after `push_back`/`erase` on a vector.
- Forgetting virtual destructor on a polymorphic base class.
- Capturing locals by reference in a lambda that outlives them.
- `std::shared_ptr` cycles leaking memory.
- Mixing signed/unsigned in comparisons; integer overflow.
