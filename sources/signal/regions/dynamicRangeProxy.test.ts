import { expect, it } from 'vitest';
import { measureDynamicRangeProxy } from './dynamicRangeProxy.ts';
import { DEFAULT_SIGNAL_SETTINGS } from '../contracts/signalSettings.ts';
import { parseSignalPcm } from '../contracts/signalPcm.ts';

it.each([
  { sampleRate: 1, length: 2 },
  { sampleRate: 1000, length: 199 },
  { sampleRate: 1000, length: 200 },
])('returns null for inadequate windows or zero measurable energy: %j', (fixture) => {
  expect(
    measureDynamicRangeProxy(
      parseSignalPcm({
        channels: [new Float32Array(fixture.length)],
        sampleRate: fixture.sampleRate,
      }),
      DEFAULT_SIGNAL_SETTINGS,
    ),
  ).toBeNull();
});

it('retains the Lab proxy over complete 100ms windows, not a loudness-range claim', () => {
  const samples = Float32Array.from({ length: 250 }, (_, index) => (index < 100 ? 0.125 : 0.5));
  const pcm = parseSignalPcm({ channels: [samples, samples], sampleRate: 1000 });
  expect(measureDynamicRangeProxy(pcm, DEFAULT_SIGNAL_SETTINGS)).toBeCloseTo(
    20 * Math.log10(4),
    12,
  );
});
