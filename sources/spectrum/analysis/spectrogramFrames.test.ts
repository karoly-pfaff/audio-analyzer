import { expect, it } from 'vitest';
import { createSpectrogramFrames, analysisFrameCenter } from './spectrogramFrames.ts';
import { DEFAULT_SPECTRUM_SETTINGS } from '../contracts/spectrumSettings.ts';

it('retains single-sample clocks and centered first/last source samples', () => {
  expect(analysisFrameCenter(0, 1, 1)).toBe(0);
  const result = createSpectrogramFrames(new Float32Array([1]), DEFAULT_SPECTRUM_SETTINGS);
  expect(result.ranges).toEqual([{ first: 0, last: 0 }]);
  expect(result.frames).toHaveLength(1);
  expect(result.frames[0]?.some((value) => value > 0)).toBe(true);
});

it('bounds stored frames while preserving a trailing event and every source window', () => {
  const samples = new Float32Array(4098);
  samples[4097] = 1;
  const result = createSpectrogramFrames(samples, {
    ...DEFAULT_SPECTRUM_SETTINGS,
    maximumFrames: 2,
  });
  expect(result.analysisFrameCount).toBe(6);
  expect(result.frames).toHaveLength(2);
  expect(result.frames[1]?.some((value) => value > 0)).toBe(true);
  expect(result.ranges[1]?.last).toBe(4097);
});
