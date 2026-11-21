import type { FrameFeatures } from '../../contracts/frameFeatures.ts';
import type { OnsetEvent } from '../../rhythm/onsets/onsetEvents.ts';
import { smoothEnvelope } from '../envelopes/smoothEnvelope.ts';
import { createOnsetEnvelope } from '../envelopes/createOnsetEnvelope.ts';

export function smoothFrameChannels(
  frames: FrameFeatures,
  onsets: readonly OnsetEvent[],
): FrameFeatures['channels'] {
  const settings = { featureHz: frames.featureHz, attackMs: 30, releaseMs: 250 };
  return {
    energy: smoothEnvelope(frames.channels.energy, settings),
    sub: smoothEnvelope(frames.channels.sub, settings),
    bass: smoothEnvelope(frames.channels.bass, settings),
    mid: smoothEnvelope(frames.channels.mid, settings),
    high: smoothEnvelope(frames.channels.high, settings),
    brightness: smoothEnvelope(frames.channels.brightness, settings),
    roughness: smoothEnvelope(frames.channels.roughness, settings),
    onsetStrength: createOnsetEnvelope(frames, onsets),
  };
}
