import MusicTempo from 'music-tempo';
import { z } from 'zod';
import type { TempoObservation } from '../contracts/tempoResult.ts';
import { QUICK_TEMPO_FFT_SIZE } from '../contracts/tempoSettings.ts';

type TempoConstructor = new (
  samples: Float32Array,
  settings: { readonly hopSize: number; readonly bufferSize: number; readonly timeStep: number },
) => unknown;

// The upstream CJS constructor has no declarations. Validate the narrow runtime port and output.
const ESTIMATOR = z
  .custom<TempoConstructor>((value) => typeof value === 'function')
  .parse(MusicTempo);

const ESTIMATE_SCHEMA = z.looseObject({ tempo: z.coerce.number().min(1).max(1000) });

const NO_RHYTHM_ERRORS = new Set<unknown>([
  'Fail to find peaks',
  'Fail to find IOIs',
  'Tempo extraction failed',
]);

export function runMusicTempo(
  samples: Float32Array,
  clock: { readonly hopSize: number; readonly sampleRate: number },
): TempoObservation {
  try {
    const parsed = ESTIMATE_SCHEMA.safeParse(
      new ESTIMATOR(samples, {
        bufferSize: QUICK_TEMPO_FFT_SIZE,
        hopSize: clock.hopSize,
        timeStep: clock.hopSize / clock.sampleRate,
      }),
    );
    return parsed.success
      ? { status: 'estimated', bpm: parsed.data.tempo }
      : { status: 'failed', code: 'invalid-estimate' };
  } catch (error) {
    return NO_RHYTHM_ERRORS.has(error)
      ? { status: 'unavailable', reason: 'insufficient-rhythm' }
      : { status: 'failed', code: 'estimator-failed' };
  }
}
