import { createAnalysisPcm } from '@karoly-pfaff/audio-analyzer';
import type { AnalysisInput } from '@karoly-pfaff/audio-analyzer';

export function createAnalysisInput(
  samples: Float32Array = new Float32Array(22050),
): AnalysisInput {
  return {
    pcm: createAnalysisPcm(samples),
    sourceSha256: 'a'.repeat(64),
    provenance: {
      pcmSha256: 'b'.repeat(64),
      decoderVersion: 'original synthetic fixture decoder v1',
    },
  };
}
