import { expect, it } from 'vitest';
import { correlateTempo } from './tempoCorrelation.ts';
import { DEFAULT_RHYTHM_SETTINGS } from '../beats/rhythmEvents.ts';
import { createDenseBeatEvidence } from '../../../tests/fixtures/audio/createDenseBeatEvidence.test-support.ts';

it('finds periodic attacks among dense unrelated subdivisions without using their total mass', () => {
  const { frames } = createDenseBeatEvidence();
  const candidates = correlateTempo(frames, DEFAULT_RHYTHM_SETTINGS);
  expect(candidates[0]?.bpm).toBeCloseTo(172.265625, 1);
  expect(candidates[0]?.correlation).toBeGreaterThan(0.6);
  expect(correlateTempo(frames, DEFAULT_RHYTHM_SETTINGS)).toEqual(candidates);
});

it('returns no periodic evidence for silence, a constant envelope or an impossible frame lag', () => {
  const { frames } = createDenseBeatEvidence();
  for (const value of [0, 1]) {
    const constant = { ...frames, raw: { ...frames.raw, flux: frames.raw.flux.map(() => value) } };
    expect(
      correlateTempo(constant, DEFAULT_RHYTHM_SETTINGS).every((tempo) => tempo.correlation === 0),
    ).toBe(true);
  }
  expect(
    correlateTempo(frames, { ...DEFAULT_RHYTHM_SETTINGS, minimumBpm: 180, maximumBpm: 180 }),
  ).toEqual([]);
  expect(
    correlateTempo({ ...frames, raw: { ...frames.raw, flux: [] } }, DEFAULT_RHYTHM_SETTINGS)[0]
      ?.correlation,
  ).toBe(0);
});
