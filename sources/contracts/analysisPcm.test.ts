import { expect, it } from 'vitest';
import { ANALYSIS_SAMPLE_RATE, createAnalysisPcm } from './analysisPcm.ts';

it('creates an independent canonical mono analysis copy without amplifying quiet signals', () => {
  const original = new Float32Array([0, 0.001, -0.002]);
  const pcm = createAnalysisPcm(original);
  expect(pcm.sampleRate).toBe(22050);
  expect(pcm.durationSeconds).toBeCloseTo(3 / ANALYSIS_SAMPLE_RATE);
  expect(pcm.normalizationGain).toBe(1);
  expect(pcm.samples).toEqual(original);
  pcm.samples[1] = 1;
  expect(original[1]).toBeCloseTo(0.001);
});

it('attenuates over-range float PCM consistently while preserving the input copy', () => {
  const samples = new Float32Array([0, 2, -4]);
  const pcm = createAnalysisPcm(samples);
  expect(pcm.samples).toEqual(new Float32Array([0, 0.5, -1]));
  expect(pcm.inputPeak).toBe(4);
  expect(pcm.normalizationGain).toBeCloseTo(0.25);
  expect(samples[2]).toBe(-4);
});

it.each([new Float32Array(0), new Float32Array([NaN]), new Float32Array([Infinity])])(
  'rejects empty or nonfinite PCM instead of creating an empty success',
  (samples) => {
    expect(() => createAnalysisPcm(samples)).toThrow('Decoded audio');
  },
);

it('preserves genuine silence as a valid nonempty signal', () => {
  expect(createAnalysisPcm(new Float32Array(100)).inputPeak).toBe(0);
});

it('rejects a JSON array or missing PCM at the runtime boundary', () => {
  expect(() => createAnalysisPcm([0, 0.1])).toThrow();
  expect(() => createAnalysisPcm(null)).toThrow();
});
