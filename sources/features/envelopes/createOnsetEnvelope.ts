import type { FrameFeatures } from '../../contracts/frameFeatures.ts';
import type { OnsetEvent } from '../../rhythm/onsets/onsetEvents.ts';
import { onsetEventSchema } from '../../rhythm/onsets/onsetEvents.ts';
import { AudioAnalysisError } from '../../contracts/AudioAnalysisError.ts';
import { smoothEnvelope } from './smoothEnvelope.ts';
import { featureValueAt } from '../statistics/featureStatistics.ts';

export function createOnsetEnvelope(
  frames: FrameFeatures,
  onsets: readonly OnsetEvent[],
): number[] {
  const impulses = Array.from<number>({ length: frames.raw.rms.length }).fill(0);
  for (const onset of onsets) {
    const index = onsetFrameIndex(frames, onset);
    impulses[index] = Math.max(featureValueAt(impulses, index), onset.strength);
  }
  return smoothEnvelope(impulses, { featureHz: frames.featureHz, attackMs: 0, releaseMs: 100 });
}

function onsetFrameIndex(frames: FrameFeatures, onset: OnsetEvent): number {
  const event = onsetEventSchema.parse(onset);
  if (
    event.time >= frames.durationSeconds ||
    !event.id.startsWith('onset-' + frames.sourceSha256.slice(0, 12) + '-')
  )
    throw new AudioAnalysisError('analysis-failed');
  return Math.min(frames.raw.rms.length - 1, Math.round(event.time * frames.featureHz));
}
