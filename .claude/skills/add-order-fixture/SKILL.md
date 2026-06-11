---
name: add-order-fixture
description: Turn a newly pasted real order into a parser test fixture. Use when the user reports an order that parses wrongly or the shop's copy/paste format changed.
---

# Add an order fixture

When the user provides an order text that the parser mishandles:

1. **Preserve the text exactly.** Add it to `src/fixtures/sampleOrder.ts` as a new exported template literal (e.g. `export const order2026_06: string`). Keep real tab characters — do not let anything convert them to spaces. If the user pasted it in chat, tabs may already be lost; ask for the original source or reconstruct the separators carefully and note it in a comment.
2. **Hand-compute the expected values** from the text: item count, a few spot-check items (name, size, model, qty, unit cents, total cents — euros × 100, integers), every fee line in cents, Sub-Total and Total in cents.
3. **Add a `describe` block** to `src/lib/__tests__/parser.test.ts` asserting those values, mirroring the existing "parseOrder — real order" block. If the source data is internally inconsistent (it happens — rounding on the shop's side), assert the warning instead of "fixing" the numbers.
4. Run `npx vitest run src/lib/__tests__/parser.test.ts`. If the new fixture fails, fix `src/lib/parser.ts` — never edit fixture text to make tests pass. All pre-existing fixtures must still pass.
5. Keep the parser's contract: never throw, return `warnings` for anything suspicious.
