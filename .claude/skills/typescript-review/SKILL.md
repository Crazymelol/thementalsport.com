---
name: typescript-review
description: Use when reviewing or writing TypeScript code, or when seeing TS issues like `any` leaking, missing strict mode, unhandled null/undefined, failed narrowing, non-exhaustive switches, or type-vs-interface confusion.
---

# TypeScript Review

## Overview
Reference for catching TypeScript-specific type-safety bugs and enforcing idiomatic typing during review.

## Quick Reference

| Pitfall | Bad | Good |
|---|---|---|
| Escape hatch | `let x: any` | `let x: unknown` + narrow |
| Loose null | implicit `undefined` | `strictNullChecks` on |
| Non-null assert | `obj!.foo` | guard / optional chain `obj?.foo` |
| Untagged union | `A \| B` ambiguous | discriminated union with `kind` |
| Non-exhaustive switch | missing default | `default: assertNever(x)` |
| Cast over check | `x as Foo` | type guard `isFoo(x)` |
| `==` | `a == b` | `a === b` |

## Key Points

- **`any` vs `unknown`**: `any` disables checking and spreads silently; `unknown` forces narrowing before use. Ban `any` via `@typescript-eslint/no-explicit-any`.
- **Strict mode**: enable `"strict": true` (covers `strictNullChecks`, `noImplicitAny`, etc.). Most real bugs are null/undefined.
- **Discriminated unions**: give each variant a literal `kind`/`type` tag so the compiler narrows in `switch`. Add an exhaustiveness check:

```ts
function assertNever(x: never): never { throw new Error(`unhandled ${x}`); }
switch (shape.kind) {
  case "circle": return ...;
  case "square": return ...;
  default: return assertNever(shape);
}
```

- **Narrowing**: use `typeof`, `instanceof`, `in`, and user-defined `x is T` guards. `as` casts bypass safety—avoid.
- **`type` vs `interface`**: `interface` for object shapes that may be extended/merged; `type` for unions, tuples, mapped/conditional types. Be consistent.
- **Null/undefined**: prefer `?.` and `??` (not `||`, which trips on `0`/`""`). Model "absent" with `T | undefined` deliberately.
- Prefer `readonly`/`as const` for immutable data; avoid `enum` in favor of union literals.

## Common Mistakes

- Typing function returns as `any` by omitting annotations on exported APIs.
- `JSON.parse()` returns `any`—validate (zod) before trusting it.
- Using `Object` / `{}` / `Function` as types (they mean almost anything).
- `// @ts-ignore` instead of `@ts-expect-error` (which fails when the error disappears).
- Array index access assumed defined—enable `noUncheckedIndexedAccess`.
- Mutating a `readonly` via aliasing or `as` cast.
