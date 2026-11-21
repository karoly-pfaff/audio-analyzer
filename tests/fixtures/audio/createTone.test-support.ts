import { ANALYSIS_SAMPLE_RATE } from '@karoly-pfaff/audio-analyzer';

export function createTone(options: {
  readonly frequency: number;
  readonly seconds: number;
  readonly amplitude?: number;
}): Float32Array {
  return Float32Array.from(
    { length: Math.round(options.seconds * ANALYSIS_SAMPLE_RATE) },
    (_, index) =>
      (options.amplitude ?? 0.5) *
      Math.sin((2 * Math.PI * options.frequency * index) / ANALYSIS_SAMPLE_RATE),
  );
}
