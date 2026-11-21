import { z } from 'zod';

export const onsetEventSchema = z.strictObject({
  id: z.string().regex(/^onset-[a-f0-9]{12}-\d+$/),
  time: z.number().nonnegative(),
  strength: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
});

export type OnsetEvent = z.infer<typeof onsetEventSchema>;

export const onsetSettingsSchema = z.strictObject({
  minimumGapSeconds: z.number().min(0.04).max(0.5),
  thresholdMultiplier: z.number().min(0.5).max(10),
  madMultiplier: z.number().min(0).max(10),
});

export type OnsetSettings = z.infer<typeof onsetSettingsSchema>;

export const DEFAULT_ONSET_SETTINGS: Readonly<OnsetSettings> = Object.freeze({
  minimumGapSeconds: 0.08,
  thresholdMultiplier: 1.5,
  madMultiplier: 2,
});
