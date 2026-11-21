import { expect, it } from 'vitest';
import { analyzeSignal } from '../../signal.ts';
import { DEFAULT_SIGNAL_SETTINGS } from '../contracts/signalSettings.ts';

it('produces an independent versioned source measurement with exact source duration', () => {
  const samples = new Float32Array([0, 0.5, 0, 1]);
  const before = samples.slice();
  const input = { channels: [samples], sampleRate: 1000 };
  const summary = analyzeSignal(input);
  expect(summary).toMatchObject({
    schemaVersion: 1,
    analyzerVersion: 'signal-rules-1.0.0',
    sampleRate: 1000,
    frameCount: 4,
    durationSeconds: 0.004,
    channelCount: 1,
    settings: DEFAULT_SIGNAL_SETTINGS,
    peakAmplitude: 1,
    clippedSampleCount: 1,
  });
  expect(summary.channelMetrics).toHaveLength(1);
  expect(summary.clipping.regions).toEqual([{ startSeconds: 0, endSeconds: 0.004 }]);
  expect(summary.silence.regionCount).toBe(0);
  expect(analyzeSignal(input)).toEqual(summary);
  expect(samples).toEqual(before);
});

it('reports settings-dependent regions with complete statistics despite bounded output', () => {
  const summary = analyzeSignal(
    { channels: [new Float32Array([0, 0.5, 0, 0.5, 0])], sampleRate: 1 },
    { ...DEFAULT_SIGNAL_SETTINGS, maximumRegions: 1, clippingThreshold: 0.5 },
  );
  expect(summary.silence).toMatchObject({
    regionCount: 3,
    regionsTruncated: true,
    longestRegionSeconds: 1,
  });
  expect(summary.clipping).toMatchObject({
    regionCount: 2,
    regionsTruncated: true,
    longestRegionSeconds: 1,
  });
  expect(summary.silentSampleRatio).toBeCloseTo(3 / 5, 12);
  expect(summary.clippedSampleCount).toBe(2);
});

it('rejects invalid inputs and settings at the public boundary', () => {
  expect(() => analyzeSignal({ channels: [], sampleRate: 1 })).toThrow();
  expect(() => analyzeSignal({ channels: [new Float32Array(1)], sampleRate: 1 }, {})).toThrow();
});
