import { describe, it, expect } from 'vitest';
import { parseOrder } from '../parser';
import { realOrder, consistentOrder } from '../../fixtures/sampleOrder';

describe('fixture integrity', () => {
  it('fixtures still contain real tab characters', () => {
    expect(realOrder).toContain('\t');
    expect(consistentOrder).toContain('\t');
  });
});

describe('parseOrder — real order', () => {
  const result = parseOrder(realOrder);

  it('parses all 32 line items', () => {
    expect(result.items).toHaveLength(32);
  });

  it('parses a two-line product with size', () => {
    const asics = result.items.find((i) => i.name.startsWith('Asics Solution Speed'));
    expect(asics).toBeDefined();
    expect(asics!.size).toBe('44');
    expect(asics!.model).toBe('23527');
    expect(asics!.qty).toBe(1);
    expect(asics!.unitPriceCents).toBe(9256);
    expect(asics!.totalCents).toBe(9256);
  });

  it('parses single-line products (caps, overgrips)', () => {
    const cap = result.items.find((i) => i.name === 'Bullpadel BPG252 I Stone Cap');
    expect(cap).toMatchObject({ model: '200499', qty: 1, unitPriceCents: 909, totalCents: 909 });
    expect(cap!.size).toBeUndefined();
  });

  it('parses quantity > 1 items', () => {
    const racket = result.items.find((i) => i.name === 'Lok Yanguas Maxx Hype Racket');
    expect(racket).toMatchObject({ qty: 3, unitPriceCents: 11157, totalCents: 33471, size: '351-375' });
  });

  it('parses the same product appearing twice with different sizes', () => {
    const shoes = result.items.filter((i) => i.name.startsWith('Adidas Crazyquick Boost'));
    expect(shoes).toHaveLength(2);
    expect(shoes.map((s) => s.size).sort()).toEqual(['41 1/3', '43 1/3']);
  });

  it('handles size values containing commas', () => {
    const puma = result.items.find((i) => i.name.startsWith('Puma Momo'));
    expect(puma!.size).toBe('44,5');
  });

  it('parses the three fee lines', () => {
    expect(result.fees).toHaveLength(3);
    expect(result.fees.map((f) => f.amountCents)).toEqual([5900, 1000, 2900]);
    expect(result.fees[0].label).toContain('Saudi Arabia Shipping');
  });

  it('parses Sub-Total and Total', () => {
    expect(result.subtotalCents).toBe(132455);
    expect(result.totalCents).toBe(142255);
  });

  it('warns about the 1-cent source inconsistency (items sum 1,324.56 vs Sub-Total 1,324.55)', () => {
    const itemsSum = result.items.reduce((a, i) => a + i.totalCents, 0);
    expect(itemsSum).toBe(132456);
    expect(result.warnings.some((w) => w.includes('Sub-Total'))).toBe(true);
  });

  it('does not warn about per-line rounding within 1 cent per unit (2 × 10.74 = 21.48 vs 21.49)', () => {
    expect(result.warnings.some((w) => w.includes('Speed RX Ball Boats'))).toBe(false);
  });
});

describe('parseOrder — consistent order', () => {
  const result = parseOrder(consistentOrder);

  it('produces zero warnings', () => {
    expect(result.warnings).toEqual([]);
  });

  it('parses items, fees and totals', () => {
    expect(result.items).toHaveLength(3);
    expect(result.fees).toHaveLength(1);
    expect(result.subtotalCents).toBe(26000);
    expect(result.totalCents).toBe(30000);
  });
});

describe('parseOrder — robustness', () => {
  it('tolerates runs of spaces instead of tabs', () => {
    const text = 'Some Cap   12345   1   9.09€   9.09€\nSub-Total   9.09€\nShipping   5.00€\nTotal   14.09€';
    const result = parseOrder(text);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ name: 'Some Cap', model: '12345', totalCents: 909 });
    expect(result.fees).toHaveLength(1);
    expect(result.totalCents).toBe(1409);
  });

  it('tolerates CRLF line endings', () => {
    const result = parseOrder(consistentOrder.replace(/\n/g, '\r\n'));
    expect(result.items).toHaveLength(3);
    expect(result.warnings).toEqual([]);
  });

  it('warns about a product name with no detail line', () => {
    const text = 'Orphan Product Name\nSub-Total\t0.00€\nTotal\t0.00€';
    const result = parseOrder(text);
    expect(result.items).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes('Orphan Product Name'))).toBe(true);
  });

  it('never throws on garbage', () => {
    expect(() => parseOrder('')).not.toThrow();
    expect(() => parseOrder('???\n\t\t\t\n42')).not.toThrow();
    expect(parseOrder('').items).toEqual([]);
  });
});
