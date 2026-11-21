import { expect, it } from 'vitest';
import { createAnalysisPcm } from '../../contracts/analysisPcm.ts';
import { extractFrameFeatures } from './extractFrameFeatures.ts';
import { createTone } from '../../../tests/fixtures/audio/createTone.test-support.ts';

it.each([
  [100, 'bass'],
  [1000, 'mid'],
  [5000, 'high'],
] as const)(
  'measures %sHz with meaningful RMS, centroid and the correct dominant band',
  (frequency, band) => {
    const frames = extractFrameFeatures(
      createAnalysisPcm(createTone({ frequency, seconds: 1 })),
      'a'.repeat(64),
    );
    expect(frames.raw.rms[20]).toBeCloseTo(0.5 / Math.SQRT2, 2);
    expect(frames.raw.centroidHz[20]).toBeGreaterThan(frequency - 20);
    expect(frames.raw.centroidHz[20]).toBeLessThan(frequency + 20);
    expect(frames.raw[band][20]).toBeGreaterThan(0.11);
    expect(frames.raw.flatness[20]).toBeLessThan(0.01);
  },
);

it('preserves silence, exact frame counts and finite bounded channels', () => {
  const frames = extractFrameFeatures(createAnalysisPcm(new Float32Array(22050)), 'a'.repeat(64));
  expect(frames.channels.energy).toHaveLength(87);
  expect(frames.channels.energy.every((value) => Math.abs(value) < 1e-12)).toBe(true);
  expect(frames.raw.centroidHz.every((value) => Math.abs(value) < 1e-12)).toBe(true);
});

it('is reproducible and isolates each Meyda extraction context', () => {
  const pcm = createAnalysisPcm(createTone({ frequency: 250, seconds: 0.5 }));
  const first = extractFrameFeatures(pcm, 'a'.repeat(64));
  extractFrameFeatures(createAnalysisPcm(new Float32Array(1024)), 'b'.repeat(64));
  expect(extractFrameFeatures(pcm, 'a'.repeat(64))).toEqual(first);
});

it('does not exaggerate numerical ripple of a steady active tone', () => {
  const frames = extractFrameFeatures(
    createAnalysisPcm(createTone({ frequency: 1000, seconds: 1 })),
    'a'.repeat(64),
  );
  expect(Math.min(...frames.channels.energy.slice(5, -5))).toBeGreaterThan(0.95);
});

it('rejects an empty or non-finite PCM buffer even when a caller bypasses creation', () => {
  const pcm = createAnalysisPcm(new Float32Array(1024));
  expect(() =>
    extractFrameFeatures({ ...pcm, samples: new Float32Array() }, 'a'.repeat(64)),
  ).toThrow('Decoded audio is empty, nonfinite');
  expect(() =>
    extractFrameFeatures({ ...pcm, samples: new Float32Array([NaN]) }, 'a'.repeat(64)),
  ).toThrow('Decoded audio is empty, nonfinite');
});
