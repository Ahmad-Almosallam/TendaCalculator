import type {
  OrderItem,
  FeeLine,
  Person,
  Assignments,
  Unit,
  PersonResult,
  CalcResults,
} from '../types';

/**
 * Largest-remainder apportionment. Splits `total` (integer minor units) across
 * `weights` so the parts are proportional and sum EXACTLY to `total`.
 */
export function apportion(total: number, weights: number[]): number[] {
  const w = weights.reduce((a, b) => a + b, 0);
  if (w === 0 || weights.length === 0) return weights.map(() => 0);
  const raw = weights.map((x) => (total * x) / w);
  const parts = raw.map(Math.floor);
  let remainder = total - parts.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - parts[i] }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; remainder > 0; k++, remainder--) parts[order[k].i]++;
  return parts;
}

/**
 * Expand items into per-unit values. Each item's units sum exactly to the
 * item's line total (handles source rounding where qty × unit ≠ total).
 */
export function buildUnits(items: OrderItem[]): Unit[] {
  return items.flatMap((item) => {
    const values = apportion(item.totalCents, Array(item.qty).fill(1));
    return values.map((valueCents, index) => ({
      unitId: `${item.id}#${index}`,
      item,
      index,
      valueCents,
    }));
  });
}

export interface CalcInput {
  items: OrderItem[];
  fees: FeeLine[];
  people: Person[];
  assignments: Assignments;
  customsHalalas: number;
  /** EUR -> SAR */
  rate: number;
}

/**
 * Per-person split. Delivery fees and customs are apportioned by each person's
 * items subtotal. EUR→SAR converts the grand total ONCE and apportions the
 * converted amount, so per-person SAR figures sum exactly to the total.
 */
export function computeResults(input: CalcInput): CalcResults {
  const { items, fees, people, assignments, customsHalalas, rate } = input;
  const units = buildUnits(items);

  const unitsByPerson = new Map<string, Unit[]>(people.map((p) => [p.id, []]));
  const excludedUnits: Unit[] = [];
  for (const unit of units) {
    const personId = assignments[unit.unitId];
    const bucket = personId ? unitsByPerson.get(personId) : undefined;
    if (bucket) bucket.push(unit);
    else excludedUnits.push(unit);
  }
  const excludedEurCents = excludedUnits.reduce((a, u) => a + u.valueCents, 0);

  const itemsEur = people.map((p) =>
    unitsByPerson.get(p.id)!.reduce((a, u) => a + u.valueCents, 0),
  );
  const feesTotal = fees.reduce((a, f) => a + f.amountCents, 0);
  const deliveryEur = apportion(feesTotal, itemsEur);
  const eurTotals = people.map((_, i) => itemsEur[i] + deliveryEur[i]);

  const orderTotalEurCents = eurTotals.reduce((a, b) => a + b, 0);
  const orderTotalHalalas = Math.round(orderTotalEurCents * rate);
  const orderSar = apportion(orderTotalHalalas, eurTotals);
  const customs = apportion(customsHalalas, itemsEur);

  const perPerson: PersonResult[] = people.map((person, i) => ({
    person,
    units: unitsByPerson.get(person.id)!,
    itemsEurCents: itemsEur[i],
    deliveryEurCents: deliveryEur[i],
    eurTotalCents: eurTotals[i],
    orderSarHalalas: orderSar[i],
    customsHalalas: customs[i],
    grandSarHalalas: orderSar[i] + customs[i],
  }));

  const grandTotalHalalas = orderTotalHalalas + customsHalalas;
  const verified =
    perPerson.reduce((a, p) => a + p.grandSarHalalas, 0) === grandTotalHalalas;

  return {
    perPerson,
    orderTotalEurCents,
    orderTotalHalalas,
    customsHalalas,
    grandTotalHalalas,
    excludedEurCents,
    excludedUnits,
    rate,
    verified,
  };
}
