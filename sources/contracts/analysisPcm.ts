import { AudioAnalysisError } from './AudioAnalysisError.ts';

export const ANALYSIS_SAMPLE_RATE = 22050;
export const MAX_ANALYSIS_SAMPLES = 1800 * ANALYSIS_SAMPLE_RATE;

export interface AnalysisPcm {
  readonly sampleRate: typeof ANALYSIS_SAMPLE_RATE;
  readonly samples: Float32Array;
  readonly durationSeconds: number;
  readonly inputPeak: number;
  readonly normalizationGain: number;
}

/** Normalize the analysis copy only. Never amplify silence/quiet noise to full scale. */
export function createAnalysisPcm(samples: unknown): AnalysisPcm {
  if (!(samples instanceof Float32Array)) throw new AudioAnalysisError('invalid-pcm');
  const inputPeak = inspectPcmPeak(samples);
  const normalizationGain = inputPeak > 1 ? 1 / inputPeak : 1;
  return {
    sampleRate: ANALYSIS_SAMPLE_RATE,
    samples: samples.map((sample) => sample * normalizationGain),
    durationSeconds: samples.length / ANALYSIS_SAMPLE_RATE,
    inputPeak,
    normalizationGain,
  };
}

function inspectPcmPeak(samples: Float32Array): number {
  if (samples.length === 0 || samples.length > MAX_ANALYSIS_SAMPLES)
    throw new AudioAnalysisError('invalid-pcm');
  let peak = 0;
  for (const sample of samples) {
    if (!Number.isFinite(sample)) throw new AudioAnalysisError('invalid-pcm');
    peak = Math.max(peak, Math.abs(sample));
  }
  return peak;
}
