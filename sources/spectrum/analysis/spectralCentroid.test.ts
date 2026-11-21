import { expect, it } from 'vitest';
import { measureSpectralCentroid } from './spectralCentroid.ts';

it.each([1, 100, 2048, 2049, 4096, 4097])(
  'preserves a full-spectrum boundary impulse across %s source samples',
  (length) => {
    const samples = new Float32Array(length);
    samples[0] = 1;
    expect(measureSpectralCentroid(samples)).toBeCloseTo(512, 5);
  },
);

it('keeps silence at zero and measures high frequencies independently of display bins', () => {
  expect(measureSpectralCentroid(new Float32Array(2048))).toBe(0);
  const tone = Float32Array.from({ length: 8193 }, (_, index) =>
    Math.sin((2 * Math.PI * 10000 * index) / 48000),
  );
  expect((measureSpectralCentroid(tone) * 48000) / 2048).toBeCloseTo(10000, -2);
});
