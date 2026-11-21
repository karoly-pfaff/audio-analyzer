import { expect, it } from 'vitest';
import { hasObservedBeatInterval } from './observedBeatInterval.ts';

function observedBeats(times: readonly number[]) {
  return times.map((time, index) => ({ id: String(index), time, confidence: 0.9 }));
}

it('follows neighboring observed cadence without requiring a fixed track-wide BPM', () => {
  const beats = observedBeats([0, 0.5, 1, 1.5, 3, 4, 5, 6, 8, 8.34, 8.68, 9.02]);
  expect([0, 1, 2, 4, 5, 6, 8, 9, 10].every((index) => hasObservedBeatInterval(beats, index))).toBe(
    true,
  );
  expect(hasObservedBeatInterval(beats, 3)).toBe(false);
  expect(hasObservedBeatInterval(beats, 7)).toBe(false);
});

it('withholds support for missing observations, isolated gaps and implausible periods', () => {
  expect(hasObservedBeatInterval([], 0)).toBe(false);
  expect(hasObservedBeatInterval(observedBeats([0, 0.5]), 0)).toBe(false);
  expect(hasObservedBeatInterval(observedBeats([0, 0.5, 1, 2, 2.5, 3]), 2)).toBe(false);
  expect(hasObservedBeatInterval(observedBeats([0, 0.1, 0.2]), 0)).toBe(false);
  expect(hasObservedBeatInterval(observedBeats([0, 2, 4]), 0)).toBe(false);
  expect(hasObservedBeatInterval(observedBeats([0, 0.5, 1]), -1)).toBe(false);
  expect(hasObservedBeatInterval(observedBeats([0, 0.5, 1]), 2)).toBe(false);
});

it('uses nearby timing tolerance and accepts the supported period endpoints', () => {
  expect(hasObservedBeatInterval(observedBeats([0, 0.5, 1.06]), 0)).toBe(true);
  expect(hasObservedBeatInterval(observedBeats([0, 0.5, 1.08]), 0)).toBe(false);
  expect(hasObservedBeatInterval(observedBeats([0, 0.25, 0.5]), 0)).toBe(true);
  expect(hasObservedBeatInterval(observedBeats([0, 1.5, 3]), 1)).toBe(true);
});
