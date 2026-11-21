import { expect, it } from 'vitest';
import { HANN_WINDOW, CENTROID_WINDOW, REVERSED_INDICES } from './spectrumWindow.ts';

it('uses a symmetric Hann display window and preserves boundary impulses for the centroid', () => {
  expect(HANN_WINDOW[0]).toBe(0);
  expect(HANN_WINDOW[2047]).toBe(0);
  expect(HANN_WINDOW[1024]).toBeCloseTo(1, 5);
  expect(CENTROID_WINDOW[0]).toBe(1 / 2048);
  expect([...HANN_WINDOW].reverse()).toEqual([...HANN_WINDOW]);
});

it('precomputes an involutive radix-two permutation over every FFT index', () => {
  expect(new Set(REVERSED_INDICES).size).toBe(2048);
  expect(REVERSED_INDICES[1]).toBe(1024);
  for (const [index, reversed] of REVERSED_INDICES.entries())
    expect(REVERSED_INDICES[reversed]).toBe(index);
});
