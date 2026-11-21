import { expect, it } from 'vitest';
import { measureSampleMetrics } from './sampleMetrics.ts';
import { DEFAULT_SIGNAL_SETTINGS } from '../contracts/signalSettings.ts';

it('measures original above-full-scale, signed DC and sample clipping without normalization', () => {
  const result = measureSampleMetrics([new Float32Array([0, 2, -4])], DEFAULT_SIGNAL_SETTINGS);
  expect(result.aggregate).toMatchObject({
    peakAmplitude: 4,
    clippedSampleCount: 2,
    clippingRisk: 'high',
  });
  expect(result.aggregate.rmsAmplitude).toBeCloseTo(Math.sqrt(20 / 3), 12);
  expect(result.aggregate.dcOffset).toBeCloseTo(-2 / 3, 12);
  expect(result.aggregate.peakDb).toBeCloseTo(20 * Math.log10(4), 12);
  expect(result.aggregate.rmsDb).toBeCloseTo(20 * Math.log10(Math.sqrt(20 / 3)), 12);
  expect(result.aggregate.crestFactorDb).toBeCloseTo(20 * Math.log10(4 / Math.sqrt(20 / 3)), 12);
  expect(result.aggregate.clippedSampleRatio).toBeCloseTo(2 / 3, 12);
  expect(result.aggregate.silentSampleRatio).toBeCloseTo(1 / 3, 12);
});

it('keeps silence valid with null dB and crest factor rather than negative infinity', () => {
  expect(measureSampleMetrics([new Float32Array(4)], DEFAULT_SIGNAL_SETTINGS).aggregate).toEqual({
    peakAmplitude: 0,
    peakDb: null,
    rmsAmplitude: 0,
    rmsDb: null,
    crestFactorDb: null,
    dcOffset: 0,
    clippedSampleCount: 0,
    clippedSampleRatio: 0,
    clippingRisk: 'none',
    silentSampleRatio: 1,
  });
});

it('reports per-channel DC and energy even when opposite channels cancel in the aggregate', () => {
  const result = measureSampleMetrics(
    [new Float32Array([0.5, 0.5]), new Float32Array([-0.5, -0.5])],
    DEFAULT_SIGNAL_SETTINGS,
  );
  expect(result.aggregate.dcOffset).toBe(0);
  expect(result.aggregate.rmsAmplitude).toBe(0.5);
  expect(result.channels.map((channel) => channel.dcOffset)).toEqual([0.5, -0.5]);
  expect(result.channels.map((channel) => channel.rmsAmplitude)).toEqual([0.5, 0.5]);
});

it.each([
  [100_001, 'low'],
  [100_000, 'medium'],
  [10_001, 'medium'],
  [10_000, 'high'],
] as const)(
  'classifies one clipped sample in %s as %s at the original risk boundaries',
  (length, risk) => {
    const samples = new Float32Array(length);
    samples[length - 1] = 1;
    expect(measureSampleMetrics([samples], DEFAULT_SIGNAL_SETTINGS).aggregate.clippingRisk).toBe(
      risk,
    );
  },
);
