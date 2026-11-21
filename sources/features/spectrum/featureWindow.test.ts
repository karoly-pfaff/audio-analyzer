import { expect, it } from 'vitest';
import { createFeatureWindow, windowRms } from './featureWindow.ts';

it('centers the first window at zero with padding outside the source', () => {
  const window = createFeatureWindow(
    Float32Array.from({ length: 1024 }, () => 1),
    0,
  );
  expect(window).toHaveLength(1024);
  expect(window[511]).toBe(0);
  expect(window[512]).toBe(1);
  expect(windowRms(window)).toBeCloseTo(Math.SQRT1_2);
});
