import { expect, it } from 'vitest';
import { selectRegionalTempo } from './regionalTempo.ts';
import { createRhythmWindows } from './rhythmWindows.ts';
import { DEFAULT_RHYTHM_SETTINGS } from '../beats/rhythmEvents.ts';
import { createDenseBeatEvidence } from '../../../tests/fixtures/audio/createDenseBeatEvidence.test-support.ts';

it('requires both periodic flux and actual onset timing to select a regional tempo', () => {
  const { frames, onsets } = createDenseBeatEvidence();
  const window = createRhythmWindows(frames, onsets)[1];
  if (!window) throw new Error('Missing fixture window.');
  const options = { referenceBpm: 172, settings: DEFAULT_RHYTHM_SETTINGS };
  expect(Math.abs((selectRegionalTempo(window, options)?.bpm ?? 0) - 172)).toBeLessThan(3);
  expect(selectRegionalTempo({ ...window, onsets: [] }, options)).toBeNull();
  expect(
    selectRegionalTempo({ ...window, frames: { ...window.frames, raw: { flux: [] } } }, options),
  ).toBeNull();
});
