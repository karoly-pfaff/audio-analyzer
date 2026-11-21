import { z } from 'zod';
import { AudioAnalysisError } from '../../contracts/AudioAnalysisError.ts';
import { quantizeFeature } from '../statistics/featureStatistics.ts';

const ENVELOPE_SETTINGS_SCHEMA = z.strictObject({
  featureHz: z.number().positive().max(1000),
  attackMs: z.number().min(0).max(10000),
  releaseMs: z.number().min(0).max(10000),
});

export interface EnvelopeSettings {
  readonly featureHz: number;
  readonly attackMs: number;
  readonly releaseMs: number;
}

/** One-pole envelope with coefficients from the source clock, never playback loop delta. */
export function smoothEnvelope(values: readonly number[], settings: EnvelopeSettings): number[] {
  const validated = ENVELOPE_SETTINGS_SCHEMA.parse(settings);
  const attack = envelopeCoefficient(validated.attackMs, validated.featureHz);
  const release = envelopeCoefficient(validated.releaseMs, validated.featureHz);
  let previous = 0;
  return values.map((target) => {
    if (!Number.isFinite(target) || target < 0 || target > 1)
      throw new AudioAnalysisError('analysis-failed');
    previous += (target - previous) * (1 - (target > previous ? attack : release));
    return quantizeFeature(previous);
  });
}

function envelopeCoefficient(milliseconds: number, featureHz: number): number {
  if (milliseconds === 0) return 0;
  return Math.exp(-1000 / (milliseconds * featureHz));
}
