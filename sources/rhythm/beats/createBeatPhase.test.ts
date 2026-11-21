import { expect, it } from 'vitest';
import { createBeatPhase } from './createBeatPhase.ts';
import { analyzeAudio } from '../../analyzeAudio.ts';
import { createAnalysisInput } from '../../../tests/fixtures/audio/createAnalysisInput.test-support.ts';
import { createPulseTrain } from '../../../tests/fixtures/audio/createPulseTrain.test-support.ts';

it('withholds phase outside observed beats and across a missing-beat gap', () => {
  const timeline = analyzeAudio(
    createAnalysisInput(createPulseTrain({ bpm: 120, seconds: 8 }).samples),
  );
  const beats = timeline.beats.filter((_, index) => index !== 3);
  const phase = createBeatPhase(timeline, { ...timeline.rhythm, beats });
  expect(phase?.[0]).toBeNull();
  expect(phase?.[Math.round(2 * timeline.featureHz)]).toBeNull();
  expect(phase?.at(-1)).toBeNull();
});

it('uses observed local intervals through tempo changes without bridging a silent passage', () => {
  const timeline = analyzeAudio(
    createAnalysisInput(createPulseTrain({ bpm: 120, seconds: 8 }).samples),
  );
  const beats = [0.5, 1, 1.5, 3.5, 4.5, 5.5, 6.5].map((time, index) => ({
    id: String(index),
    time,
    confidence: 0.9,
  }));
  const phase = createBeatPhase(timeline, { ...timeline.rhythm, beats });
  expect(phase?.[Math.round(0.75 * timeline.featureHz)]).toBeCloseTo(0.5, 1);
  expect(phase?.[Math.round(4 * timeline.featureHz)]).toBeCloseTo(0.5, 1);
  expect(phase?.[Math.round(2.5 * timeline.featureHz)]).toBeNull();
});
