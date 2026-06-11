let seq = 0;

/** Unique-enough id for items, fees and people created during a session. */
export function uid(prefix: string): string {
  seq += 1;
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${seq}-${rand}`;
}
