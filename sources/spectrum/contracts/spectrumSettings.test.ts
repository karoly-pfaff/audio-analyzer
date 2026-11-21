import { expect, it } from 'vitest';
import { DEFAULT_SPECTRUM_SETTINGS, parseSpectrumSettings } from './spectrumSettings.ts';

it('keeps the Lab display defaults explicit', () => {
  expect(parseSpectrumSettings(DEFAULT_SPECTRUM_SETTINGS)).toEqual({
    channel: 'mean',
    maximumFrames: 256,
    bins: 256,
    dbFloor: -80,
  });
});

it.each([
  {},
  null,
  { ...DEFAULT_SPECTRUM_SETTINGS, bins: 0 },
  { ...DEFAULT_SPECTRUM_SETTINGS, bins: 1026 },
  { ...DEFAULT_SPECTRUM_SETTINGS, maximumFrames: 1025 },
  { ...DEFAULT_SPECTRUM_SETTINGS, maximumFrames: 1.5 },
  { ...DEFAULT_SPECTRUM_SETTINGS, channel: -1 },
  { ...DEFAULT_SPECTRUM_SETTINGS, channel: 32 },
  { ...DEFAULT_SPECTRUM_SETTINGS, dbFloor: 0 },
  { ...DEFAULT_SPECTRUM_SETTINGS, dbFloor: -161 },
  { ...DEFAULT_SPECTRUM_SETTINGS, extra: true },
])('rejects unsupported or unbounded settings: %j', (settings) => {
  expect(() => parseSpectrumSettings(settings)).toThrow(
    expect.objectContaining({ code: 'invalid-settings' }),
  );
});
