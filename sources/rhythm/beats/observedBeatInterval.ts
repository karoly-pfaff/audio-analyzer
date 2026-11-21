import type { BeatEvent } from './rhythmEvents.ts';

export function hasObservedBeatInterval(beats: readonly BeatEvent[], index: number): boolean {
  const period = observedPeriod(beats, index);
  if (period < 0.25 || period > 1.5) return false;
  return [-2, -1, 1, 2].some((offset) => {
    const neighbor = observedPeriod(beats, index + offset);
    return Math.abs(neighbor / period - 1) <= 0.14;
  });
}

function observedPeriod(beats: readonly BeatEvent[], index: number): number {
  const before = beats[index];
  const after = beats[index + 1];
  return before && after ? after.time - before.time : 0;
}
