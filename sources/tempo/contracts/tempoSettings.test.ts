import { expect, it } from 'vitest';
import { DEFAULT_QUICK_TEMPO_SETTINGS, parseQuickTempoSettings } from './tempoSettings.ts';

it('keeps quick analysis limited to the first minute with explicit channel selection', () => {
  expect(parseQuickTempoSettings(DEFAULT_QUICK_TEMPO_SETTINGS)).toEqual({
    channel: 'mean',
    maximumSeconds: 60,
  });
});

it.each([
  null,
  {},
  { ...DEFAULT_QUICK_TEMPO_SETTINGS, maximumSeconds: 0 },
  { ...DEFAULT_QUICK_TEMPO_SETTINGS, maximumSeconds: 61 },
  { ...DEFAULT_QUICK_TEMPO_SETTINGS, channel: 32 },
  { ...DEFAULT_QUICK_TEMPO_SETTINGS, maximumSeconds: NaN },
])('rejects invalid or unbounded quick settings: %j', (settings) => {
  expect(() => parseQuickTempoSettings(settings)).toThrow(
    expect.objectContaining({ code: 'invalid-settings' }),
  );
});
