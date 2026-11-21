import { z } from 'zod';
import { SignalAnalysisError } from './SignalAnalysisError.ts';

export const SIGNAL_PCM_LIMITS = Object.freeze({ channels: 32, sampleValues: 100_000_000 });

export interface SignalPcm {
  readonly channels: readonly [Float32Array, ...Float32Array[]];
  readonly sampleRate: number;
  readonly frameCount: number;
  readonly durationSeconds: number;
}

const INPUT_SCHEMA = z.strictObject({
  channels: z
    .tuple([z.instanceof(Float32Array)])
    .rest(z.instanceof(Float32Array))
    .refine((channels) => channels.length <= SIGNAL_PCM_LIMITS.channels),
  sampleRate: z.number().int().positive().max(768_000),
});

/** Borrows channel storage for synchronous reads; never normalizes, resamples or copies PCM. */
export function parseSignalPcm(input: unknown): SignalPcm {
  const parsed = INPUT_SCHEMA.safeParse(input);
  if (!parsed.success || !hasSignalSampleClock(parsed.data.channels))
    throw new SignalAnalysisError('invalid-pcm');
  const frameCount = parsed.data.channels[0].length;
  return { ...parsed.data, frameCount, durationSeconds: frameCount / parsed.data.sampleRate };
}

function hasSignalSampleClock(channels: SignalPcm['channels']): boolean {
  const frameCount = channels[0].length;
  return (
    frameCount > 0 &&
    frameCount * channels.length <= SIGNAL_PCM_LIMITS.sampleValues &&
    channels.every((samples) => samples.length === frameCount && samples.every(Number.isFinite))
  );
}
