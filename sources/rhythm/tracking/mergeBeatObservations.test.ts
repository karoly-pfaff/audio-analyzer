import { expect, it } from 'vitest';
import { mergeBeatObservations } from './mergeBeatObservations.ts';

function observedBeat(id: string, time: number, confidence: number) {
  return { id, time, confidence };
}

it('keeps actual ordered observations and the strongest confidence for duplicate IDs', () => {
  const first = observedBeat('first', 1, 0.9);
  const next = observedBeat('next', 1.5, 0.8);
  expect(
    mergeBeatObservations([next, first], [first, { ...next, confidence: 0.95 }], 0.25),
  ).toEqual([first, { ...next, confidence: 0.95 }]);
  expect(mergeBeatObservations([], [], 0.25)).toEqual([]);
});

it('rejects incompatible nearby phases and retains earlier observations on tied confidence', () => {
  const first = observedBeat('first', 1, 0.7);
  const stronger = observedBeat('stronger', 1.1, 0.9);
  const tied = observedBeat('tied', 1.2, 0.9);
  const weaker = observedBeat('weaker', 1.3, 0.5);
  const next = observedBeat('next', 1.6, 0.9);
  expect(mergeBeatObservations([first, next], [tied, stronger, weaker], 0.5)).toEqual([
    stronger,
    next,
  ]);
});
