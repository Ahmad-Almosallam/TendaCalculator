---
name: test-parser
description: Run and interpret the order-parser unit tests. Use after any change to src/lib/parser.ts, src/lib/money.ts or the fixtures, or when a pasted order fails to parse.
---

# Test the order parser

Run only the parser suite:
```
npx vitest run src/lib/__tests__/parser.test.ts
```
Run everything (parser + split math + money): `npm test`.

## Interpreting failures

- **"fixtures still contain real tab characters" fails** — an editor or tool converted the tabs in `src/fixtures/sampleOrder.ts` to spaces. Restore the literal tabs; the parser's primary tokenizer splits on `\t`.
- **Item-count or field assertions fail** — the parser state machine in `src/lib/parser.ts` regressed. Check, in order: `tokenize` (tabs first, then runs of 2+ spaces), the terminator checks (`Sub-Total`/`Total` must be tested BEFORE item shapes), variant-line handling (`- Talla-Peso: ...` keeps `pendingName` for repeated sizes), and `isPrice` in `money.ts`.
- **Warning assertions fail** — the real-order fixture is intentionally inconsistent by 1 cent (items sum 1,324.56€ vs Sub-Total 1,324.55€). The parser MUST warn about the subtotal mismatch and MUST NOT warn about per-line rounding within 1 cent per unit. Do not "fix" the fixture.

## Rules

- The parser must never throw — return best-effort results plus `warnings`.
- All fixtures must keep passing after a parser change. If a new real-world paste format needs support, add a NEW fixture instead of editing the existing ones (see the `add-order-fixture` skill).
