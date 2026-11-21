import { featureValueAt } from './featureStatistics.ts';

export function createFeaturePrefix(values: readonly number[]): readonly number[] {
  const prefix = [0];
  for (const value of values) prefix.push(featureValueAt(prefix, prefix.length - 1) + value);
  return prefix;
}

export function meanFeatureRegion(prefix: readonly number[], start: number, end: number): number {
  const first = Math.max(0, Math.min(prefix.length - 1, Math.floor(start)));
  const last = Math.max(first, Math.min(prefix.length - 1, Math.ceil(end)));
  return ((prefix[last] ?? 0) - (prefix[first] ?? 0)) / Math.max(1, last - first);
}
