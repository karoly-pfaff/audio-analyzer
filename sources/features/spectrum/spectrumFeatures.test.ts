import { afterEach, expect, it, vi } from 'vitest';
import Meyda from 'meyda';
import { z } from 'zod';
import { AudioAnalysisError } from '../../contracts/AudioAnalysisError.ts';
import { createSpectrumExtractor } from './spectrumFeatures.ts';

afterEach(() => {
  vi.restoreAllMocks();
});

it('rejects a malformed dependency response instead of inventing spectral features', () => {
  const original = z.unknown().parse(Reflect.get(Meyda, 'extract'));
  Reflect.set(
    Meyda,
    'extract',
    vi.fn(() => null),
  );
  const extract = createSpectrumExtractor();
  try {
    expect(() => extract(new Float32Array(1024).fill(0.2), new Float32Array())).toThrow(
      AudioAnalysisError,
    );
  } finally {
    Reflect.set(Meyda, 'extract', original);
  }
});

it('defines spectral shape as zero when a nonzero sample lies exactly on a zero Hann endpoint', () => {
  const window = new Float32Array(1024);
  window[1023] = 1;
  const measured = createSpectrumExtractor()(window, new Float32Array(512));
  expect(measured.rms).toBeGreaterThan(0);
  expect(measured.centroidHz).toBe(0);
  expect(measured.flatness).toBe(0);
});

it('handles floating-point flatness roundoff for a theoretically flat impulse spectrum', () => {
  const window = new Float32Array(1024);
  window[256] = 1;
  const measured = createSpectrumExtractor()(window, new Float32Array(512));
  expect(measured.flatness).toBeCloseTo(1, 10);
  expect(measured.flatness).toBeLessThanOrEqual(1);
});
