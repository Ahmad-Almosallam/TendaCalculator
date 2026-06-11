import { describe, it, expect } from 'vitest';
import { apportion, buildUnits, computeResults } from '../split';
import { parseOrder } from '../parser';
import { consistentOrder } from '../../fixtures/sampleOrder';
import type { Person, Assignments } from '../../types';

describe('apportion', () => {
  it('splits with exact sum and largest-remainder rounding', () => {
    expect(apportion(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(apportion(10, [1, 2, 3])).toEqual([2, 3, 5]);
  });

  it('handles zero weights', () => {
    expect(apportion(100, [0, 0])).toEqual([0, 0]);
    expect(apportion(100, [0, 1])).toEqual([0, 100]);
    expect(apportion(100, [])).toEqual([]);
  });

  it('always sums exactly to the total (randomized)', () => {
    // deterministic LCG so the test is reproducible
    let seed = 42;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let run = 0; run < 200; run++) {
      const n = 1 + Math.floor(rnd() * 8);
      const weights = Array.from({ length: n }, () => Math.floor(rnd() * 50000));
      const total = Math.floor(rnd() * 1000000);
      const parts = apportion(total, weights);
      const w = weights.reduce((a, b) => a + b, 0);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(w === 0 ? 0 : total);
      parts.forEach((p) => expect(p).toBeGreaterThanOrEqual(0));
    }
  });
});

describe('buildUnits', () => {
  it('expands qty into units whose values sum exactly to the line total', () => {
    const item = {
      id: 'x', name: 'Balls', model: '1', qty: 2,
      unitPriceCents: 1074, totalCents: 2149, // 2 × 10.74 = 21.48 ≠ 21.49 in source data
    };
    const units = buildUnits([item]);
    expect(units).toHaveLength(2);
    expect(units.map((u) => u.unitId)).toEqual(['x#0', 'x#1']);
    expect(units[0].valueCents + units[1].valueCents).toBe(2149);
  });
});

describe('computeResults', () => {
  const people: Person[] = [
    { id: 'p1', name: 'Ali', color: 'blue' },
    { id: 'p2', name: 'Omar', color: 'green' },
  ];

  it('splits the consistent fixture exactly, verification holds', () => {
    const parsed = parseOrder(consistentOrder);
    // Racket Pro: 2 units × 100€; Cap 10€; Shoes 50€
    const [racket, cap, shoes] = parsed.items;
    const assignments: Assignments = {
      [`${racket.id}#0`]: 'p1',
      [`${racket.id}#1`]: 'p2',
      [`${cap.id}#0`]: 'p1',
      [`${shoes.id}#0`]: 'p2',
    };
    const r = computeResults({
      items: parsed.items,
      fees: parsed.fees,
      people,
      assignments,
      customsHalalas: 15000, // 150 SAR
      rate: 4.5,
    });

    // Ali: 110€ items, Omar: 150€ items; 40€ shipping split 110:150
    expect(r.perPerson[0].itemsEurCents).toBe(11000);
    expect(r.perPerson[1].itemsEurCents).toBe(15000);
    expect(r.perPerson[0].deliveryEurCents + r.perPerson[1].deliveryEurCents).toBe(4000);
    expect(r.orderTotalEurCents).toBe(30000); // matches the order Total
    expect(r.orderTotalHalalas).toBe(135000); // 300€ × 4.5
    expect(r.excludedEurCents).toBe(0);

    const grandSum = r.perPerson.reduce((a, p) => a + p.grandSarHalalas, 0);
    expect(grandSum).toBe(135000 + 15000);
    expect(r.verified).toBe(true);
  });

  it('excludes unassigned units and reports them', () => {
    const parsed = parseOrder(consistentOrder);
    const [racket, cap] = parsed.items;
    const assignments: Assignments = {
      [`${racket.id}#0`]: 'p1',
      [`${racket.id}#1`]: 'p1',
      [`${cap.id}#0`]: 'p2',
      // shoes (50€) unassigned
    };
    const r = computeResults({
      items: parsed.items,
      fees: parsed.fees,
      people,
      assignments,
      customsHalalas: 0,
      rate: 4.0,
    });
    expect(r.excludedEurCents).toBe(5000);
    expect(r.excludedUnits).toHaveLength(1);
    // fees are still fully distributed among the assigned people
    expect(r.orderTotalEurCents).toBe(21000 + 4000);
    expect(r.verified).toBe(true);
  });

  it('verification still exact for awkward rates and remainders', () => {
    const parsed = parseOrder(consistentOrder);
    const [racket, cap, shoes] = parsed.items;
    const assignments: Assignments = {
      [`${racket.id}#0`]: 'p1',
      [`${racket.id}#1`]: 'p2',
      [`${cap.id}#0`]: 'p2',
      [`${shoes.id}#0`]: 'p1',
    };
    const r = computeResults({
      items: parsed.items,
      fees: parsed.fees,
      people,
      assignments,
      customsHalalas: 33333,
      rate: 4.327225,
    });
    const grandSum = r.perPerson.reduce((a, p) => a + p.grandSarHalalas, 0);
    expect(grandSum).toBe(r.orderTotalHalalas + 33333);
    expect(r.verified).toBe(true);
  });
});
