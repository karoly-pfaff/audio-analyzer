import type { FrameFeatures } from '../../contracts/frameFeatures.ts';
import type { RhythmResult } from './rhythmEvents.ts';
import { quantizeFeature, clampFeature } from '../../features/statistics/featureStatistics.ts';
import { hasObservedBeatInterval } from './observedBeatInterval.ts';

export function createBeatPhase(
  frames: FrameFeatures,
  rhythm: RhythmResult,
): readonly (number | null)[] | null {
  if (rhythm.bpm === null || rhythm.beats.length < 2) return null;
  let index = 0;
  return frames.channels.energy.map((_, frame) => {
    const time = frame / frames.featureHz;
    while ((rhythm.beats[index + 1]?.time ?? Infinity) <= time) index += 1;
    return phaseBetweenBeats({ rhythm, index }, time);
  });
}

function phaseBetweenBeats(
  context: { rhythm: RhythmResult; index: number },
  time: number,
): number | null {
  const before = context.rhythm.beats[context.index];
  const after = context.rhythm.beats[context.index + 1];
  if (!before || !after || time < before.time) return null;
  const interval = after.time - before.time;
  if (!hasObservedBeatInterval(context.rhythm.beats, context.index)) return null;
  return quantizeFeature(clampFeature((time - before.time) / interval));
}
