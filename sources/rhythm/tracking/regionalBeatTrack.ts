import type { FrameFeatures } from '../../contracts/frameFeatures.ts';
import type { OnsetEvent } from '../onsets/onsetEvents.ts';
import type { RhythmResult, RhythmSettings } from '../beats/rhythmEvents.ts';
import { createRhythmWindows } from './rhythmWindows.ts';
import { observeWindowBeats } from './localBeatChains.ts';
import { mergeBeatObservations } from './mergeBeatObservations.ts';

export function extendObservedBeatTrack(
  frames: FrameFeatures,
  onsets: readonly OnsetEvent[],
  options: { readonly rhythm: RhythmResult; readonly settings: RhythmSettings },
): RhythmResult {
  const referenceBpm = options.rhythm.bpm;
  if (referenceBpm === null) return options.rhythm;
  const windows = createRhythmWindows(frames, onsets);
  const observations = windows.flatMap((window) =>
    observeWindowBeats(window, { referenceBpm, settings: options.settings }),
  );
  const beats = mergeBeatObservations(
    options.rhythm.beats,
    observations,
    60 / options.settings.maximumBpm,
  );
  const confidence = Math.max(options.rhythm.confidence, ...beats.map((beat) => beat.confidence));
  return { ...options.rhythm, confidence, beats: [...beats] };
}
