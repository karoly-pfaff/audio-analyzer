import { z } from 'zod';
import { TempoAnalysisError } from '../contracts/TempoAnalysisError.ts';

export type BpmRelation = 'compatible' | 'close' | 'halfDouble' | 'mismatch';

const BPM_SCHEMA = z.number().positive();

function parseBpm(input: unknown): number {
  const parsed = BPM_SCHEMA.safeParse(input);
  if (!parsed.success) throw new TempoAnalysisError('invalid-bpm');
  return parsed.data;
}

export function normalizeBpm(input: unknown): number {
  let normalized = parseBpm(input);
  while (normalized >= 120) normalized /= 2;
  while (normalized < 60) normalized *= 2;
  return normalized;
}

export function isHalfDoubleMatch(first: unknown, second: unknown): boolean {
  const left = normalizeBpm(first);
  const right = normalizeBpm(second);
  return (
    Math.min(Math.abs(left - right), Math.abs(left * 2 - right), Math.abs(right * 2 - left)) <= 5
  );
}

export function getBpmRelation(first: unknown, second: unknown): BpmRelation {
  const difference = Math.abs(parseBpm(first) - parseBpm(second));
  if (difference <= 2) return 'compatible';
  if (difference <= 5) return 'close';
  return isHalfDoubleMatch(first, second) ? 'halfDouble' : 'mismatch';
}

export function areBpmsCompatible(first: unknown, second: unknown): boolean {
  return getBpmRelation(first, second) !== 'mismatch';
}
