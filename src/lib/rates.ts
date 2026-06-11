export interface RateInfo {
  rate: number;
  source: string;
  /** epoch millis of the fetch */
  at: number;
}

// SAR is pegged to USD at 3.75, so EUR/SAR realistically sits around 4.0-4.6.
function sane(rate: unknown): rate is number {
  return typeof rate === 'number' && rate > 3 && rate < 6;
}

async function fetchPrimary(): Promise<RateInfo> {
  const res = await fetch('https://open.er-api.com/v6/latest/EUR', {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`open.er-api.com HTTP ${res.status}`);
  const data = await res.json();
  const rate = data?.rates?.SAR;
  if (!sane(rate)) throw new Error('open.er-api.com returned no sane SAR rate');
  return { rate, source: 'Exchange Rate API (open.er-api.com)', at: Date.now() };
}

async function fetchFallback(): Promise<RateInfo> {
  const res = await fetch(
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json',
    { signal: AbortSignal.timeout(8000) },
  );
  if (!res.ok) throw new Error(`currency-api HTTP ${res.status}`);
  const data = await res.json();
  const rate = data?.eur?.sar;
  if (!sane(rate)) throw new Error('currency-api returned no sane SAR rate');
  return { rate, source: 'fawazahmed0/currency-api', at: Date.now() };
}

/** Fetch the live EUR→SAR rate; tries the primary API, then the fallback. */
export async function fetchEurSar(): Promise<RateInfo> {
  try {
    return await fetchPrimary();
  } catch {
    return await fetchFallback();
  }
}
