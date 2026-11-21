import { expect, it } from 'vitest';
import {
  clampFeature,
  percentile,
  quantizeFeature,
  featureValueAt,
  requireFeatureEntry,
} from './featureStatistics.ts';

it('computes interpolated percentiles without mutating the raw observations', () => {
  const values = [3, 1, 4, 2];
  expect(percentile(values, 0.5)).toBeCloseTo(2.5);
  expect(percentile(values, 0)).toBe(1);
  expect(percentile([], 0.95)).toBe(0);
  expect(values).toEqual([3, 1, 4, 2]);
});

it('defines empty/out-of-range observations and supports typed DSP buffers', () => {
  expect(percentile([1, 2], -2)).toBe(0);
  expect(featureValueAt([], 0)).toBe(0);
  expect(featureValueAt(new Float32Array([0.5]), 0)).toBe(0.5);
  expect(featureValueAt(new Float32Array([0.5]), 1)).toBe(0);
});

it('clamps normalized values and quantizes finite measurement output reproducibly', () => {
  expect(clampFeature(-1)).toBe(0);
  expect(clampFeature(2)).toBe(1);
  expect(quantizeFeature(0.1234567891)).toBeCloseTo(0.123456789, 9);
});

it('rejects incomplete dense feature tables without replacing valid zero observations', () => {
  expect(requireFeatureEntry(0)).toBe(0);
  expect(() => {
    requireFeatureEntry(undefined);
  }).toThrow('Incomplete feature table.');
});
