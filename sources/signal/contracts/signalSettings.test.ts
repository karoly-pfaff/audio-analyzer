import { expect, it } from 'vitest';
import { DEFAULT_SIGNAL_SETTINGS, parseSignalSettings } from './signalSettings.ts';

it('retains the Signal Lab measurement thresholds and windows explicitly', () => {
  expect(parseSignalSettings(DEFAULT_SIGNAL_SETTINGS)).toEqual({
    clippingThreshold: 0.999,
    silenceThreshold: 0.0001,
    silenceWindowSeconds: 0.05,
    clippingWindowSeconds: 0.01,
    dynamicWindowSeconds: 0.1,
    minimumDynamicRms: 0.000001,
    maximumRegions: 200,
  });
});

it.each([
  null,
  { ...DEFAULT_SIGNAL_SETTINGS, clippingThreshold: 0 },
  { ...DEFAULT_SIGNAL_SETTINGS, silenceThreshold: 2 },
  { ...DEFAULT_SIGNAL_SETTINGS, silenceWindowSeconds: NaN },
  { ...DEFAULT_SIGNAL_SETTINGS, clippingWindowSeconds: -1 },
  { ...DEFAULT_SIGNAL_SETTINGS, dynamicWindowSeconds: Infinity },
  { ...DEFAULT_SIGNAL_SETTINGS, minimumDynamicRms: 0 },
  { ...DEFAULT_SIGNAL_SETTINGS, maximumRegions: 0 },
  { ...DEFAULT_SIGNAL_SETTINGS, maximumRegions: 10_001 },
  { ...DEFAULT_SIGNAL_SETTINGS, maximumRegions: 1.5 },
  { ...DEFAULT_SIGNAL_SETTINGS, extra: true },
])('rejects invalid settings rather than silently substituting defaults: %j', (settings) => {
  expect(() => parseSignalSettings(settings)).toThrow(
    expect.objectContaining({ code: 'invalid-settings' }),
  );
});
