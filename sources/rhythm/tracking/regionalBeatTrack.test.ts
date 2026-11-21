import { expect, it } from 'vitest';
import { extendObservedBeatTrack } from './regionalBeatTrack.ts';
import { DEFAULT_RHYTHM_SETTINGS } from '../beats/rhythmEvents.ts';
import type { RhythmResult } from '../beats/rhythmEvents.ts';
import { createRegionalBeatEvidence } from '../../../tests/fixtures/audio/createRegionalBeatEvidence.test-support.ts';

it('extends confident reference rhythm over separated passages with deterministic real observations', () => {
  const { frames, onsets } = createRegionalBeatEvidence();
  const rhythm: RhythmResult = {
    bpm: 172,
    confidence: 0.7,
    ambiguous: false,
    candidates: [],
    beats: [],
  };
  const options = { rhythm, settings: DEFAULT_RHYTHM_SETTINGS };
  const result = extendObservedBeatTrack(frames, onsets, options);
  expect(result.beats.length).toBeGreaterThan(90);
  expect(result.beats.every((beat) => beat.confidence <= result.confidence)).toBe(true);
  expect(extendObservedBeatTrack(frames, onsets, options)).toEqual(result);
  const unknown = { ...rhythm, bpm: null, ambiguous: true };
  expect(extendObservedBeatTrack(frames, onsets, { ...options, rhythm: unknown })).toBe(unknown);
  expect(extendObservedBeatTrack(frames, [], options)).toEqual(rhythm);
});
