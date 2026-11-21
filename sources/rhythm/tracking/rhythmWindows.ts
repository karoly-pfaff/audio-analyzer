import type { FrameFeatures } from '../../contracts/frameFeatures.ts';
import type { OnsetEvent } from '../onsets/onsetEvents.ts';
import type { TempoFrames } from '../periodicity/tempoCorrelation.ts';

export interface RhythmWindow {
  readonly start: number;
  readonly end: number;
  readonly frames: TempoFrames;
  readonly onsets: readonly OnsetEvent[];
}

/** Disjoint eight-second ownership with four seconds of observed context on either side. */
export function createRhythmWindows(
  frames: FrameFeatures,
  onsets: readonly OnsetEvent[],
): readonly RhythmWindow[] {
  return Array.from({ length: Math.ceil(frames.durationSeconds / 8) }, (_, index) =>
    createRhythmWindow(frames, onsets, index * 8),
  );
}

function createRhythmWindow(
  frames: FrameFeatures,
  onsets: readonly OnsetEvent[],
  start: number,
): RhythmWindow {
  const end = Math.min(frames.durationSeconds, start + 8);
  const low = Math.max(0, start - 4);
  const high = Math.min(frames.durationSeconds, end + 4);
  return {
    start,
    end,
    frames: {
      featureHz: frames.featureHz,
      raw: {
        flux: frames.raw.flux.slice(
          Math.floor(low * frames.featureHz),
          Math.ceil(high * frames.featureHz),
        ),
      },
    },
    onsets: onsets.filter((onset) => onset.time >= low && onset.time < high),
  };
}
