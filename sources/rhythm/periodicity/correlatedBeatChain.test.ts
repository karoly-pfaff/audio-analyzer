import { expect, it } from 'vitest';
import { findCorrelatedBeatEvidence } from './correlatedBeatChain.ts';
import { DEFAULT_RHYTHM_SETTINGS } from '../beats/rhythmEvents.ts';
import { createDenseBeatEvidence } from '../../../tests/fixtures/audio/createDenseBeatEvidence.test-support.ts';

it('requires both periodic frames and a long accurate chain of actual observed attacks', () => {
  const { frames, onsets } = createDenseBeatEvidence();
  const result = findCorrelatedBeatEvidence(frames, onsets, DEFAULT_RHYTHM_SETTINGS);
  expect(result).not.toBeNull();
  expect(Math.abs((result?.chain.candidate.bpm ?? 0) - 172.265625)).toBeLessThan(2);
  expect(result?.confidence).toBeGreaterThanOrEqual(0.65);
  expect(result?.chain.onsets.every((onset) => onsets.includes(onset))).toBe(true);
  expect(findCorrelatedBeatEvidence(frames, [], DEFAULT_RHYTHM_SETTINGS)).toBeNull();
  expect(
    findCorrelatedBeatEvidence(frames, onsets.slice(0, 8), DEFAULT_RHYTHM_SETTINGS),
  ).toBeNull();
  expect(
    findCorrelatedBeatEvidence(frames, onsets, {
      ...DEFAULT_RHYTHM_SETTINGS,
      minimumConfidence: 1,
    }),
  ).toBeNull();
});

it('abstains for missing, weak or competing periodic evidence and respects refined tempo bounds', () => {
  const { frames, onsets } = createDenseBeatEvidence();
  expect(
    findCorrelatedBeatEvidence(frames, onsets, {
      ...DEFAULT_RHYTHM_SETTINGS,
      minimumBpm: 180,
      maximumBpm: 180,
    }),
  ).toBeNull();
  expect(
    findCorrelatedBeatEvidence(
      { ...frames, raw: { ...frames.raw, flux: frames.raw.flux.map(() => 0) } },
      onsets,
      DEFAULT_RHYTHM_SETTINGS,
    ),
  ).toBeNull();
  const drifting = {
    ...frames,
    raw: { ...frames.raw, flux: frames.raw.flux.map((_, index) => 1 + Math.sin(index / 100)) },
  };
  expect(findCorrelatedBeatEvidence(drifting, onsets, DEFAULT_RHYTHM_SETTINGS)).toBeNull();
  expect(
    findCorrelatedBeatEvidence(frames, onsets, {
      ...DEFAULT_RHYTHM_SETTINGS,
      minimumBpm: 172,
      maximumBpm: 173,
    }),
  ).toBeNull();
  const faster = onsets.map((onset) => ({ ...onset, time: onset.time * 0.98 }));
  expect(
    findCorrelatedBeatEvidence(frames, faster, {
      ...DEFAULT_RHYTHM_SETTINGS,
      minimumBpm: 170,
      maximumBpm: 173,
    }),
  ).toBeNull();
});
