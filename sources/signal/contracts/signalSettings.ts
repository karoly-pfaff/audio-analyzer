import { z } from 'zod';
import { SignalAnalysisError } from './SignalAnalysisError.ts';

export const SIGNAL_ANALYZER_VERSION = 'signal-rules-1.0.0';

export const signalSettingsSchema = z.strictObject({
  clippingThreshold: z.number().positive().max(1),
  silenceThreshold: z.number().positive().max(1),
  silenceWindowSeconds: z.number().positive().max(10),
  clippingWindowSeconds: z.number().positive().max(10),
  dynamicWindowSeconds: z.number().positive().max(10),
  minimumDynamicRms: z.number().positive().max(1),
  maximumRegions: z.number().int().positive().max(10_000),
});

export type SignalSettings = Readonly<z.infer<typeof signalSettingsSchema>>;

export const DEFAULT_SIGNAL_SETTINGS: SignalSettings = Object.freeze({
  clippingThreshold: 0.999,
  silenceThreshold: 0.0001,
  silenceWindowSeconds: 0.05,
  clippingWindowSeconds: 0.01,
  dynamicWindowSeconds: 0.1,
  minimumDynamicRms: 0.000001,
  maximumRegions: 200,
});

export function parseSignalSettings(input: unknown): SignalSettings {
  const parsed = signalSettingsSchema.safeParse(input);
  if (!parsed.success) throw new SignalAnalysisError('invalid-settings');
  return parsed.data;
}
