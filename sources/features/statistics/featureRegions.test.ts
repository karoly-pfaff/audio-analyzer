import { expect, it } from 'vitest';
import { createFeaturePrefix, meanFeatureRegion } from './featureRegions.ts';

it('measures bounded half-open regions without losing a partial final window', () => {
  const prefix = createFeaturePrefix([1, 2, 3]);
  expect(prefix).toEqual([0, 1, 3, 6]);
  expect(meanFeatureRegion(prefix, 0, 3)).toBe(2);
  expect(meanFeatureRegion(prefix, 1, 2)).toBe(2);
  expect(meanFeatureRegion(prefix, 2, 3.5)).toBe(3);
  expect(meanFeatureRegion(prefix, 4, 8)).toBe(0);
});

it('clips empty and out-of-bounds feature regions without inventing energy', () => {
  expect(meanFeatureRegion([], 0, 10)).toBe(0);
  const prefix = createFeaturePrefix([1, 0, 0.5]);
  expect(meanFeatureRegion(prefix, -10, 1)).toBe(1);
  expect(meanFeatureRegion(prefix, 10, 20)).toBe(0);
  expect(meanFeatureRegion(prefix, 0, 3)).toBe(0.5);
});
