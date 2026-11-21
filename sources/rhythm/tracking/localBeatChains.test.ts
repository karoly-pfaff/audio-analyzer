import { expect, it } from 'vitest';
import { observeWindowBeats } from './localBeatChains.ts';
import { createRhythmWindows } from './rhythmWindows.ts';
import { DEFAULT_RHYTHM_SETTINGS } from '../beats/rhythmEvents.ts';
import { createRegionalBeatEvidence } from '../../../tests/fixtures/audio/createRegionalBeatEvidence.test-support.ts';
import { createDenseBeatEvidence } from '../../../tests/fixtures/audio/createDenseBeatEvidence.test-support.ts';

it('retains observed chains across the recording without filling real silent gaps', () => {
  const { frames, onsets } = createRegionalBeatEvidence();
  const windows = createRhythmWindows(frames, onsets);
  const beats = windows.flatMap((window) =>
    observeWindowBeats(window, { referenceBpm: 172, settings: DEFAULT_RHYTHM_SETTINGS }),
  );
  expect(beats.length).toBeGreaterThan(90);
  const observedTimes = new Set(onsets.map((onset) => onset.time));
  expect(beats.every((beat) => observedTimes.has(beat.time))).toBe(true);
  expect(beats.some((beat) => beat.time >= 24 && beat.time < 38)).toBe(true);
  expect(beats.some((beat) => beat.time >= 46)).toBe(true);
  expect(beats.some((beat) => beat.time >= 16.1 && beat.time < 23.9)).toBe(false);
  expect(new Set(beats.map((beat) => beat.id)).size).toBe(beats.length);
});

it('abstains when local evidence does not meet the confidence threshold', () => {
  const { frames, onsets } = createRegionalBeatEvidence();
  const window = createRhythmWindows(frames, onsets)[0];
  if (!window) throw new Error('Missing fixture window.');
  expect(
    observeWindowBeats(window, {
      referenceBpm: 172,
      settings: { ...DEFAULT_RHYTHM_SETTINGS, minimumConfidence: 1 },
    }),
  ).toEqual([]);
});

it('withholds short chains and chains whose refined cadence falls outside configured bounds', () => {
  const { frames, onsets } = createDenseBeatEvidence();
  const window = createRhythmWindows(frames, onsets)[1];
  if (!window) throw new Error('Missing fixture window.');
  const accents = window.onsets.filter((onset) => onset.strength === 1);
  const options = { referenceBpm: 172, settings: DEFAULT_RHYTHM_SETTINGS };
  expect(observeWindowBeats({ ...window, onsets: accents.slice(0, 7) }, options)).toEqual([]);
  for (const scale of [0.98, 1.02]) {
    const shifted = accents.map((onset) => ({ ...onset, time: onset.time * scale }));
    expect(
      observeWindowBeats(
        { ...window, onsets: shifted },
        { ...options, settings: { ...options.settings, minimumBpm: 170, maximumBpm: 173 } },
      ),
    ).toEqual([]);
  }
});

it('rejects a locally jittering chain when tempo refinement leaves fewer than eight observations', () => {
  const { frames, onsets } = createDenseBeatEvidence();
  const window = createRhythmWindows(frames, onsets)[1];
  if (!window) throw new Error('Missing fixture window.');
  const times = [
    8, 8.304761904761905, 8.621017687074831, 9.01424761904762, 9.340255782312926, 9.716070748299321,
    10.04974149659864, 10.395602721088437,
  ];
  const observations = times.map((time, index) => ({
    id: 'onset-aaaaaaaaaaaa-' + String(index),
    time,
    strength: 1,
    confidence: 1,
  }));
  expect(
    observeWindowBeats(
      { ...window, onsets: observations },
      { referenceBpm: 172, settings: DEFAULT_RHYTHM_SETTINGS },
    ),
  ).toEqual([]);
});
