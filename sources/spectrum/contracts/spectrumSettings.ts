import { z } from 'zod';
import { SpectrumAnalysisError } from './SpectrumAnalysisError.ts';

export const SPECTRUM_ANALYZER_VERSION = 'spectrum-rules-1.0.0-fft2048';
export const SPECTRUM_FFT_SIZE = 2048;
export const SPECTRUM_HOP_SIZE = SPECTRUM_FFT_SIZE / 2;
export const SPECTRUM_BIN_COUNT = SPECTRUM_FFT_SIZE / 2 + 1;

export const spectrumSettingsSchema = z.strictObject({
  channel: z.union([z.literal('mean'), z.number().int().min(0).max(31)]),
  maximumFrames: z.number().int().min(1).max(1024),
  bins: z.number().int().min(1).max(SPECTRUM_BIN_COUNT),
  dbFloor: z.number().min(-160).max(-1),
});

export type SpectrumSettings = Readonly<z.infer<typeof spectrumSettingsSchema>>;

export const DEFAULT_SPECTRUM_SETTINGS: SpectrumSettings = Object.freeze({
  channel: 'mean',
  maximumFrames: 256,
  bins: 256,
  dbFloor: -80,
});

export function parseSpectrumSettings(input: unknown): SpectrumSettings {
  const parsed = spectrumSettingsSchema.safeParse(input);
  if (!parsed.success) throw new SpectrumAnalysisError('invalid-settings');
  return parsed.data;
}
