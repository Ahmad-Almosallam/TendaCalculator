import { describe, it, expect } from 'vitest';
import { parseEuro, isPrice, formatEur, formatSar } from '../money';

describe('parseEuro', () => {
  it('parses plain euro amounts', () => {
    expect(parseEuro('92.56€')).toBe(9256);
    expect(parseEuro('59.00€')).toBe(5900);
    expect(parseEuro('59.00')).toBe(5900);
  });
  it('parses thousands separators', () => {
    expect(parseEuro('1,324.55€')).toBe(132455);
    expect(parseEuro('1,422.55€')).toBe(142255);
  });
  it('returns null for non-numbers', () => {
    expect(parseEuro('abc')).toBeNull();
    expect(parseEuro('')).toBeNull();
  });
});

describe('isPrice', () => {
  it('accepts euro-suffixed and two-decimal values', () => {
    expect(isPrice('92.56€')).toBe(true);
    expect(isPrice('1,324.55€')).toBe(true);
    expect(isPrice('59.00')).toBe(true);
  });
  it('rejects bare integers (quantities, model numbers)', () => {
    expect(isPrice('1')).toBe(false);
    expect(isPrice('23527')).toBe(false);
    expect(isPrice('hello')).toBe(false);
  });
});

describe('formatting', () => {
  it('formats EUR and SAR from minor units', () => {
    expect(formatEur(132455)).toBe('1,324.55 €');
    expect(formatSar(9256)).toBe('92.56 SAR');
  });
});
