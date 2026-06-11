import type { OrderItem, FeeLine, ParseResult } from '../types';
import { parseEuro, isPrice } from './money';
import { uid } from './uid';

/** Split a line into fields: tabs first, falling back to runs of 2+ spaces for pastes that lost tabs. */
function tokenize(line: string): string[] {
  let fields = line.split(/\t+/).map((f) => f.trim()).filter((f) => f !== '');
  if (fields.length < 2) {
    const bySpaces = line.split(/\s{2,}/).map((f) => f.trim()).filter((f) => f !== '');
    if (bySpaces.length > fields.length) fields = bySpaces;
  }
  return fields;
}

/** "- Talla-Peso: -44" -> "44"; "- Talla-Peso: -351-375" -> "351-375" */
function extractSize(field: string): string {
  const afterColon = field.match(/:\s*-?\s*(.+)$/);
  if (afterColon) return afterColon[1].trim();
  return field.replace(/^-\s*/, '').trim();
}

function isVariantLine(firstField: string): boolean {
  return /^-\s*\S/.test(firstField);
}

/**
 * Parse a raw pasted order. Never throws: best-effort items/fees plus warnings.
 * Expected shape: header, item lines (single-line or name line + "  - Talla-Peso: ..." line),
 * Sub-Total, fee lines (shipping / volume surcharges), Total.
 */
export function parseOrder(raw: string): ParseResult {
  const items: OrderItem[] = [];
  const fees: FeeLine[] = [];
  const warnings: string[] = [];
  let subtotalCents: number | null = null;
  let totalCents: number | null = null;

  const lines = raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l) => l.trim() !== '');

  let pendingName: string | null = null;
  let pendingNameUsed = false;

  const flushPendingName = (lineNo: number) => {
    if (pendingName !== null && !pendingNameUsed) {
      warnings.push(`Line ${lineNo}: product name "${pendingName}" had no detail line with model/quantity/price — it was skipped.`);
    }
    pendingName = null;
    pendingNameUsed = false;
  };

  const makeItem = (
    name: string,
    size: string | undefined,
    fields: string[],
    lineNo: number,
  ) => {
    const qty = parseInt(fields[2], 10);
    const unitPriceCents = parseEuro(fields[3]);
    const itemTotalCents = parseEuro(fields[4]);
    if (!Number.isFinite(qty) || qty <= 0 || unitPriceCents === null || itemTotalCents === null) {
      warnings.push(`Line ${lineNo}: could not read quantity/price for "${name}".`);
      return;
    }
    items.push({
      id: uid('item'),
      name,
      size,
      model: fields[1],
      qty,
      unitPriceCents,
      totalCents: itemTotalCents,
    });
  };

  lines.forEach((line, i) => {
    const lineNo = i + 1;
    const fields = tokenize(line);
    if (fields.length === 0) return;
    const f0 = fields[0];

    // header
    if (i === 0 && /^product\s*name$/i.test(f0)) return;

    // terminators / totals
    if (/^sub-?total$/i.test(f0)) {
      flushPendingName(lineNo);
      subtotalCents = parseEuro(fields[fields.length - 1]);
      return;
    }
    if (/^total$/i.test(f0)) {
      flushPendingName(lineNo);
      totalCents = parseEuro(fields[fields.length - 1]);
      return;
    }

    // variant/continuation line: "  - Talla-Peso: -44 <tab> model qty price total"
    if (isVariantLine(f0) && fields.length >= 5 && pendingName !== null) {
      makeItem(pendingName, extractSize(f0), fields, lineNo);
      pendingNameUsed = true; // keep pendingName: a product can repeat with several sizes
      return;
    }

    // single-line item: "Name <tab> model qty price total"
    if (fields.length >= 5 && /^\d+$/.test(fields[2]) && isPrice(fields[3]) && isPrice(fields[4])) {
      flushPendingName(lineNo);
      makeItem(f0, undefined, fields, lineNo);
      return;
    }

    // fee line: "Label <tab> amount" (shipping, volume surcharges)
    if (fields.length === 2 && isPrice(fields[1])) {
      flushPendingName(lineNo);
      const amountCents = parseEuro(fields[1]);
      if (amountCents !== null) {
        fees.push({ id: uid('fee'), label: f0, amountCents });
      }
      return;
    }

    // name-only line, continued on the next line
    if (!isPrice(fields[fields.length - 1])) {
      flushPendingName(lineNo);
      pendingName = fields.join(' ').trim();
      return;
    }

    warnings.push(`Line ${lineNo}: could not understand "${line.trim()}".`);
  });
  flushPendingName(lines.length);

  // validation pass — informational only, the editable table is the fix
  for (const it of items) {
    if (Math.abs(it.qty * it.unitPriceCents - it.totalCents) > it.qty) {
      warnings.push(
        `"${it.name}": quantity × unit price (${((it.qty * it.unitPriceCents) / 100).toFixed(2)}€) does not match the line total (${(it.totalCents / 100).toFixed(2)}€).`,
      );
    }
  }
  const itemsSum = items.reduce((a, it) => a + it.totalCents, 0);
  if (subtotalCents !== null && itemsSum !== subtotalCents) {
    warnings.push(
      `Parsed items sum to ${(itemsSum / 100).toFixed(2)}€ but the order Sub-Total says ${(subtotalCents / 100).toFixed(2)}€ (difference ${((itemsSum - subtotalCents) / 100).toFixed(2)}€).`,
    );
  }
  const feesSum = fees.reduce((a, f) => a + f.amountCents, 0);
  if (subtotalCents !== null && totalCents !== null && subtotalCents + feesSum !== totalCents) {
    warnings.push(
      `Sub-Total + fees (${((subtotalCents + feesSum) / 100).toFixed(2)}€) does not match the order Total (${(totalCents / 100).toFixed(2)}€).`,
    );
  }
  if (items.length === 0) {
    warnings.push('No items could be parsed. Check that the text was pasted with its original layout.');
  }

  return { items, fees, subtotalCents, totalCents, warnings };
}
