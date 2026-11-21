import { expect, it } from 'vitest';
import { createAnalysisPcm } from '../../contracts/analysisPcm.ts';
import { extractFrameFeatures } from '../../features/spectrum/extractFrameFeatures.ts';
import { detectOnsets } from '../onsets/detectOnsets.ts';
import { trackRhythm } from './trackRhythm.ts';
import { createPulseTrain } from '../../../tests/fixtures/audio/createPulseTrain.test-support.ts';
import { createTone } from '../../../tests/fixtures/audio/createTone.test-support.ts';
import type { OnsetEvent } from '../onsets/onsetEvents.ts';
import { createDenseBeatEvidence } from '../../../tests/fixtures/audio/createDenseBeatEvidence.test-support.ts';
import { createRegionalBeatEvidence } from '../../../tests/fixtures/audio/createRegionalBeatEvidence.test-support.ts';

function pulseAnalysis(bpm: number) {
  const fixture = createPulseTrain({ bpm, seconds: 12 });
  const frames = extractFrameFeatures(createAnalysisPcm(fixture.samples), 'a'.repeat(64));
  return { fixture, frames, onsets: detectOnsets(frames) };
}

it.each([90, 120, 174])('tracks regular %i BPM kicks at actual timestamps within 40ms', (bpm) => {
  const { fixture, frames, onsets } = pulseAnalysis(bpm);
  const result = trackRhythm(frames, onsets);
  expect(result.bpm).toBeCloseTo(bpm, 0);
  expect(result.confidence).toBeGreaterThanOrEqual(0.65);
  expect(result.beats).toHaveLength(fixture.onsets.length);
  expect(
    result.beats.every((beat, index) => Math.abs(beat.time - (fixture.onsets[index] ?? -1)) < 0.04),
  ).toBe(true);
  expect(trackRhythm(frames, onsets)).toEqual(result);
});

it('retains half/double alternatives and obeys the configured tempo range', () => {
  const { frames, onsets } = pulseAnalysis(174);
  const ambiguous = onsets.map((onset, index) => ({
    ...onset,
    strength: index % 2 === 0 ? 1 : 0.1,
  }));
  const result = trackRhythm(frames, ambiguous);
  expect(result.candidates.some((candidate) => Math.abs(candidate.bpm - 87) < 2)).toBe(true);
  expect(result.candidates.some((candidate) => Math.abs(candidate.bpm - 174) < 2)).toBe(true);
  expect(result.ambiguous).toBe(true);
  expect(result.beats).toEqual([]);
  const constrained = trackRhythm(frames, onsets, {
    minimumBpm: 150,
    maximumBpm: 190,
    minimumConfidence: 0.65,
  });
  expect(constrained.bpm).toBeCloseTo(174, 0);
});

it('does not force a confident beat for ambient, silence or too little evidence', () => {
  const samples = createTone({ frequency: 220, seconds: 2, amplitude: 0.000001 });
  const frames = extractFrameFeatures(createAnalysisPcm(samples), 'a'.repeat(64));
  expect(trackRhythm(frames, detectOnsets(frames))).toMatchObject({
    bpm: null,
    confidence: 0,
    beats: [],
  });
});

it('rejects unordered or foreign onsets and invalid settings', () => {
  const { frames, onsets } = pulseAnalysis(120);
  expect(() => trackRhythm(frames, [...onsets].reverse())).toThrow();
  expect(() =>
    trackRhythm(frames, onsets, { minimumBpm: 200, maximumBpm: 80, minimumConfidence: 0.65 }),
  ).toThrow();
});

function syntheticOnsets(times: readonly number[]): readonly OnsetEvent[] {
  return times.map((time, index) => ({
    id: 'onset-' + 'a'.repeat(12) + '-' + String(index),
    time,
    strength: 1,
    confidence: 1,
  }));
}

it('follows gradual live timing changes without replacing observations with a fixed clock', () => {
  const { frames } = pulseAnalysis(120);
  const times = Array.from(
    { length: 20 },
    (_, index) => 0.5 + index * 0.48 + index * index * 0.0008,
  );
  const result = trackRhythm(frames, syntheticOnsets(times));
  expect(result.beats.length).toBeGreaterThan(15);
  expect(result.beats.every((beat) => times.includes(beat.time))).toBe(true);
});

it('withholds a grid for irregular syncopated breaks with no stable periodic chain', () => {
  const { frames } = pulseAnalysis(120);
  const times = [
    0.1, 0.38, 0.91, 1.64, 2.05, 2.83, 3.13, 4.01, 4.64, 5.79, 6.13, 7.57, 8.38, 9.04, 10.17, 11.3,
  ];
  expect(trackRhythm(frames, syntheticOnsets(times)).beats).toEqual([]);
});

it('recovers a verified observed beat chain when unrelated subdivisions dilute total onset coverage', () => {
  const { frames, onsets } = createDenseBeatEvidence();
  const result = trackRhythm(frames, onsets);
  expect(Math.abs((result.bpm ?? 0) - 172.265625)).toBeLessThan(2);
  expect(result.confidence).toBeGreaterThanOrEqual(0.65);
  expect(result.beats.length).toBeGreaterThan(40);
  const observedTimes = new Set(onsets.map((onset) => onset.time));
  expect(result.beats.every((beat) => observedTimes.has(beat.time))).toBe(true);
  expect(trackRhythm(frames, onsets)).toEqual(result);
});

it('keeps disconnected rhythmic passages and slower local observations across the full recording', () => {
  const { frames, onsets } = createRegionalBeatEvidence();
  const result = trackRhythm(frames, onsets);
  expect(result.beats.length).toBeGreaterThan(60);
  expect(result.beats.some((beat) => beat.time < 10)).toBe(true);
  expect(result.beats.some((beat) => beat.time > 30 && beat.time < 38)).toBe(true);
  expect(result.beats.some((beat) => beat.time > 54)).toBe(true);
  const observedTimes = new Set(onsets.map((onset) => onset.time));
  expect(result.beats.every((beat) => observedTimes.has(beat.time))).toBe(true);
});
