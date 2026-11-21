import { expect, it } from 'vitest';
import { SpectrumFrame } from './SpectrumFrame.ts';

it('max-pools original linear magnitudes before global dB normalization', () => {
  const frame = new SpectrumFrame(3);
  frame.append(new Float64Array([1, 0.1, 0]));
  frame.append(new Float64Array([0.5, 0.01, 0]));
  expect(frame.peak()).toBe(1);
  expect(frame.magnitudes).toEqual(new Float32Array([1, 0.1, 0]));
  const normalized = frame.normalize(1, -80);
  expect(normalized[0]).toBe(1);
  expect(normalized[1]).toBeCloseTo(0.75, 6);
  expect(normalized[2]).toBe(0);
  expect(new SpectrumFrame(1).normalize(0, -80)).toEqual(new Float32Array(1));
});
