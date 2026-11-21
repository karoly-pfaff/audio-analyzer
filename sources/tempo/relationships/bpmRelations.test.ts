import { expect, it } from 'vitest';
import { normalizeBpm, isHalfDoubleMatch, getBpmRelation, areBpmsCompatible } from '../../tempo.ts';

it.each([
  [90, 90],
  [60, 60],
  [120, 60],
  [140, 70],
  [40, 80],
  [30, 60],
  [240, 60],
])('folds positive BPM %s to %s', (input, expected) => {
  expect(normalizeBpm(input)).toBe(expected);
});

it.each([
  [60, 119.9],
  [59.9, 120],
  [61, 119],
  [70, 140],
  [85, 170],
  [100, 102],
])('retains Layer Lab octave-boundary matching for %s and %s', (first, second) => {
  expect(isHalfDoubleMatch(first, second)).toBe(true);
});

it.each([
  [120, 121, 'compatible'],
  [120, 124, 'close'],
  [85, 170, 'halfDouble'],
  [90, 130, 'mismatch'],
] as const)('classifies %s and %s as %s', (first, second, relation) => {
  expect(getBpmRelation(first, second)).toBe(relation);
  expect(areBpmsCompatible(first, second)).toBe(relation !== 'mismatch');
});

it.each([0, -1, NaN, Infinity, -Infinity, null, '120'])(
  'rejects invalid BPM %s instead of entering an unbounded folding loop',
  (input) => {
    expect(() => normalizeBpm(input)).toThrow(expect.objectContaining({ code: 'invalid-bpm' }));
    expect(() => getBpmRelation(120, input)).toThrow();
  },
);

it.each([Number.MIN_VALUE, Number.MAX_VALUE])(
  'keeps extreme finite positive BPM bounded: %s',
  (bpm) => {
    expect(normalizeBpm(bpm)).toBeGreaterThanOrEqual(60);
    expect(normalizeBpm(bpm)).toBeLessThan(120);
  },
);
