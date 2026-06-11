# Tenda Calculator

Splits a group order from a Spanish padel shop (prices in EUR) among several people, with
delivery fees and Saudi customs divided proportionally by each person's items subtotal, and
final amounts shown in SAR using a live (and editable) EUR→SAR exchange rate.

## How it works

1. **Order** — paste the order text exactly as copied from the shop, press *Parse*, fix
   anything in the editable tables.
2. **Assign** — add people, then tap an item to pick who gets it (or drag it onto a person).
   Items with quantity > 1 become individual units so each one can go to a different person.
3. **Customs** — enter the customs fee in SAR and check the exchange rate (fetched
   automatically, manually overridable).
4. **Results** — per-person totals in SAR with an exact verification row: shares always sum
   to order total + customs, to the halala.

State is saved in the browser (localStorage); use **Reset** to start over.

## Development

```
npm install
npm run dev      # dev server with HMR
npm test         # unit tests (parser + split math)
npm run build    # type-check + production build
```

Built with React 19, Ant Design 6, zustand, dnd-kit and Vite. See `CLAUDE.md` for
architecture and invariants.
