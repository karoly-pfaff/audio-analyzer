import { expect, it } from 'vitest';
import { observedBeatConfidence } from './observedBeatConfidence.ts';

const CHAIN = [0.5, 1, 1.5, 2, 3].map((time, index) => ({
  id: 'onset-aaaaaaaaaaaa-' + String(index),
  time,
  strength: 0.1,
  confidence: 0.1,
}));

it('accepts quiet but repeatedly timed observations without exceeding song confidence', () => {
  expect(observedBeatConfidence(CHAIN, 1, { bpm: 120, confidence: 0.72 })).toBeCloseTo(0.72);
  expect(observedBeatConfidence(CHAIN, 2, { bpm: 120, confidence: 0.72 })).toBeCloseTo(0.72);
});

it('withholds skipped/edge timing and cannot turn weak song evidence into a confident beat', () => {
  expect(observedBeatConfidence([], 0, { bpm: 120, confidence: 0.72 })).toBe(0);
  expect(observedBeatConfidence(CHAIN, 3, { bpm: 120, confidence: 0.72 })).toBeLessThan(0.65);
  expect(observedBeatConfidence(CHAIN, 4, { bpm: 120, confidence: 0.72 })).toBeLessThan(0.65);
  expect(observedBeatConfidence(CHAIN, 1, { bpm: 120, confidence: 0.5 })).toBeLessThan(0.65);
});
