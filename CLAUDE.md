# TendaCalculator

A mobile-first React web app that splits a group order from a Spanish padel shop (EUR) among
several people, with delivery fees and Saudi customs divided proportionally and final amounts
shown in SAR. Four-step wizard: **Order** (paste & parse) → **Assign** (drag/tap items to
people) → **Customs** (SAR fee + EUR→SAR rate) → **Results**.

## Commands

- `npm run dev` — Vite dev server (HMR; code edits do not need a restart)
- `npm run build` — type-check (`tsc -b`) + production build; must pass clean
- `npm test` / `npm run test:watch` — vitest unit tests (pure logic only)
- `npm run lint` — ESLint
- `npm run smoke` — Playwright end-to-end smoke test (`scripts/smoke.mjs`); requires the dev
  server running on :5173. Walks the real order through all 4 steps and saves screenshots to
  `scripts/screenshot-*.png`

## Architecture

- **Single zustand store** in `src/store/useOrderStore.ts`, persisted to localStorage key
  `tenda-calculator-v1`. All app state (raw text, items, fees, people, assignments, customs,
  rates, current step) lives there; components are thin.
- **Pure logic in `src/lib/`** — `parser.ts`, `split.ts`, `money.ts`, `rates.ts`, `uid.ts`.
  No React imports allowed there; this is what the unit tests cover.
- `src/components/steps/` map 1:1 to the wizard phases; shared widgets live in
  `src/components/`.
- Exchange rate: primary `open.er-api.com/v6/latest/EUR`, fallback
  `cdn.jsdelivr.net/npm/@fawazahmed0/currency-api` — both keyless; manual override always wins.

## Invariants — do not break

- **All money is integer minor units** (EUR cents / SAR halalas). Format only at render time
  via `formatEur`/`formatSar`. Never store or compute with floats except the FX rate itself.
- **`apportion(total, weights)` must sum exactly to `total`** (largest-remainder method).
  Never replace it with naive per-share rounding — the Results verification row depends on
  exact integer equality.
- EUR→SAR conversion happens **once** on the grand total, which is then apportioned — never
  convert per person.
- **Units are derived, never stored**: unit id = `` `${itemId}#${index}` ``. After any item
  edit/reparse, `pruneAssignments` drops stale unit ids.
- **The parser never throws.** It returns best-effort items plus `warnings`; the editable
  tables in PasteStep are the correction mechanism.
- antd is **v6** (no React-19 patch package needed). Use `App.useApp()` for modal/message,
  not the static `Modal.confirm`/`message` functions.
- Mobile-first: tap-to-assign (AssignSheet drawer) is the primary interaction; dnd-kit drag
  (8px pointer / 200ms long-press activation) is the desktop enhancement.

## Test fixtures

`src/fixtures/sampleOrder.ts` holds a **verbatim real order** (tab-separated — keep the real
tab characters; a test asserts they exist) and a fully-consistent synthetic order that must
parse with zero warnings. Do not edit existing fixtures to make a failing test pass — the
real order is intentionally inconsistent by 1 cent (items sum 1,324.56€ vs Sub-Total
1,324.55€) and the parser must warn about it. To support a new paste format, add a new
fixture (see the `add-order-fixture` skill).
