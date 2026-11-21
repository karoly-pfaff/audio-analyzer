import { expect, it } from 'vitest';
import { Radix2Fft } from './Radix2Fft.ts';

it('measures a bin-centered tone without mutating the source and resets scratch state', () => {
  const fft = new Radix2Fft();
  const samples = Float32Array.from({ length: 2048 }, (_, index) =>
    Math.sin((2 * Math.PI * 64 * index) / 2048),
  );
  const before = samples.slice();
  const magnitudes = fft.transform(samples, 0, new Float32Array(2048).fill(1));
  expect(magnitudes[64]).toBeCloseTo(1024, 3);
  expect(magnitudes[63]).toBeLessThan(0.001);
  expect(samples).toEqual(before);
  expect(fft.transform(new Float32Array(1), 0, new Float32Array(2048).fill(1))).toEqual(
    new Float64Array(1025),
  );
});

it('rejects numeric overflow instead of returning nonfinite display data', () => {
  expect(() =>
    new Radix2Fft().transform(new Float32Array(2048).fill(3e38), 0, new Float32Array(2048).fill(1)),
  ).toThrow(expect.objectContaining({ code: 'numeric-overflow' }));
});
