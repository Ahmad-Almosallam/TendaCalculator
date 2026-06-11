/** Parse a euro amount like "92.56€", "1,324.55€", "59.00" into integer cents. Returns null if no number found. */
export function parseEuro(s: string): number | null {
  const m = s.match(/-?[\d,]*\.?\d+/);
  if (!m) return null;
  const num = parseFloat(m[0].replace(/,/g, ''));
  if (Number.isNaN(num)) return null;
  return Math.round(num * 100);
}

/** Is the string a money value, e.g. "92.56€", "1,324.55€" or "59.00"? The € sign is optional but two decimals are required without it. */
export function isPrice(s: string): boolean {
  const t = s.trim();
  return /^-?[\d,]+(\.\d+)?\s*€$/.test(t) || /^-?[\d,]+\.\d{2}$/.test(t);
}

export function formatEur(cents: number): string {
  return `${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export function formatSar(halalas: number): string {
  return `${(halalas / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
}
