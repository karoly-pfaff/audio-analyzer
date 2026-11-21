/** Dense feature and beat tables must retain every observation owned by their construction. */
export function requireFeatureEntry<Value>(value: Value | undefined): Value {
  if (value === undefined) throw new Error('Incomplete feature table.');
  return value;
}

export function percentile(values: readonly number[], fraction: number): number {
  if (values.length === 0) return 0;
  const ordered = [...values].sort((left, right) => left - right);
  const position = (ordered.length - 1) * fraction;
  const lower = Math.floor(position);
  const first = ordered[lower] ?? 0;
  return first + ((ordered[lower + 1] ?? first) - first) * (position - lower);
}

export function quantizeFeature(value: number): number {
  return Math.round(value * 1_000_000_000) / 1_000_000_000;
}

export function clampFeature(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function featureValueAt(values: ArrayLike<number>, index: number): number {
  return values[index] ?? 0;
}
