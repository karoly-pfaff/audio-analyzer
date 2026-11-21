import { z } from 'zod';
import { TempoAnalysisError } from './TempoAnalysisError.ts';

export const QUICK_TEMPO_VERSION = 'quick-tempo-1.0.0-music-tempo-1.0.3';
export const QUICK_TEMPO_SAMPLE_LIMIT = 3_000_000;
export const QUICK_TEMPO_FFT_SIZE = 2048;

export const quickTempoSettingsSchema = z.strictObject({
  channel: z.union([z.literal('mean'), z.number().int().min(0).max(31)]),
  maximumSeconds: z.number().positive().max(60),
});

export type QuickTempoSettings = Readonly<z.infer<typeof quickTempoSettingsSchema>>;

export const DEFAULT_QUICK_TEMPO_SETTINGS: QuickTempoSettings = Object.freeze({
  channel: 'mean',
  maximumSeconds: 60,
});

export function parseQuickTempoSettings(input: unknown): QuickTempoSettings {
  const parsed = quickTempoSettingsSchema.safeParse(input);
  if (!parsed.success) throw new TempoAnalysisError('invalid-settings');
  return parsed.data;
}
