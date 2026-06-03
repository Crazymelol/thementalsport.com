---
name: python-review
description: Use when reviewing or writing Python code, or when seeing Python bugs like mutable default arguments, late-binding closures, GIL contention, leaked file handles, missing type hints, or import/virtualenv issues.
---

# Python Review

## Overview
Reference for catching Python-specific bugs and enforcing idiomatic CPython code during review.

## Quick Reference

| Pitfall | Bad | Good |
|---|---|---|
| Mutable default arg | `def f(x, acc=[]):` | `def f(x, acc=None): acc = acc or []` |
| Late-binding closure | `[lambda: i for i in range(3)]` | `[lambda i=i: i for i in range(3)]` |
| Bare except | `except:` | `except SpecificError:` |
| Manual file close | `f = open(p); ...` | `with open(p) as f:` |
| `==` for identity | `if x == None` | `if x is None` |
| Truthiness vs None | `if not x:` (hides `0`/`[]`) | `if x is None:` |
| Loop list build | `for ...: out.append(...)` | comprehension / generator |

## Key Points

- **GIL**: threads do NOT parallelize CPU-bound work. Use `multiprocessing`/`concurrent.futures.ProcessPoolExecutor` for CPU; threads only help I/O-bound.
- **Comprehensions**: prefer generators (`(x for x in ...)`) for large/streamed data to avoid materializing lists. Don't nest more than 2 levels.
- **Type hints**: use `from __future__ import annotations` or `X | None`; prefer `Sequence`/`Mapping` for params, concrete types for returns. Run `mypy`/`pyright`.
- **Context managers**: anything acquiring a resource (files, locks, DB conns, sockets) must use `with`; write `__enter__`/`__exit__` or `@contextmanager` for custom ones.
- **Dataclasses**: use `@dataclass(frozen=True)` over hand-written `__init__`; never use mutable class attrs as instance state.
- **f-strings** over `%`/`.format()`. Use `pathlib.Path` over `os.path` string juggling.
- **Equality**: define `__eq__` and `__hash__` together; default `__hash__` is identity.

```python
# Generator avoids building a full list in memory
total = sum(x * 2 for x in big_iterable)
```

## Common Mistakes

- Mutating a list/dict while iterating over it (`RuntimeError: dictionary changed size`).
- Catching `Exception` and swallowing it without logging/re-raising.
- Relying on dict ordering pre-3.7 assumptions, or relying on set ordering at all.
- Using `is` to compare values (`x is 256` works by luck via small-int caching, `x is 257` fails).
- Forgetting `requirements.txt`/`pyproject.toml` pinning; installing into system Python instead of a venv.
- Heavy work at import time (module side effects) causing slow/circular imports.
- `assert` for runtime validation (stripped under `python -O`).
