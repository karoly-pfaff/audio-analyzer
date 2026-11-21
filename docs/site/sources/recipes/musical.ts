import { analyzeAudio, createAnalysisPcm } from '@karoly-pfaff/audio-analyzer';
import type { AudioFeatureTimeline } from '@karoly-pfaff/audio-analyzer';

interface MusicalRecipeInput {
  readonly mono22050: Float32Array;
  readonly sourceSha256: string;
  readonly pcmSha256: string;
  readonly decoderVersion: string;
}

export function analyzeMusic(input: MusicalRecipeInput): AudioFeatureTimeline {
  // The host must actually downmix/resample first; this function does not resample.
  const pcm = createAnalysisPcm(input.mono22050);
  return analyzeAudio({
    pcm,
    sourceSha256: input.sourceSha256,
    provenance: { pcmSha256: input.pcmSha256, decoderVersion: input.decoderVersion },
  });
}
