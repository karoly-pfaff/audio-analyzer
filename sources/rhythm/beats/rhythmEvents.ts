import { z } from 'zod';

export const rhythmSettingsSchema = z
  .strictObject({
    minimumBpm: z.number().min(40).max(240),
    maximumBpm: z.number().min(40).max(240),
    minimumConfidence: z.number().min(0.5).max(1),
  })
  .refine((settings) => settings.maximumBpm >= settings.minimumBpm);

export const DEFAULT_RHYTHM_SETTINGS = Object.freeze({
  minimumBpm: 50,
  maximumBpm: 220,
  minimumConfidence: 0.65,
});

export type RhythmSettings = z.infer<typeof rhythmSettingsSchema>;

export const tempoCandidateSchema = z.strictObject({
  bpm: z.number().min(40).max(240),
  score: z.number().min(0).max(1),
  coverage: z.number().min(0).max(1),
  continuity: z.number().min(0).max(1),
  timing: z.number().min(0).max(1),
});

export const beatEventSchema = z.strictObject({
  id: z.string().regex(/^beat-[a-f0-9]{12}-\d+$/),
  time: z.number().nonnegative(),
  confidence: z.number().min(0).max(1),
});

export const rhythmResultSchema = z.strictObject({
  bpm: z.number().min(40).max(240).nullable(),
  confidence: z.number().min(0).max(1),
  ambiguous: z.boolean(),
  candidates: z.array(tempoCandidateSchema).max(8),
  beats: z.array(beatEventSchema).max(22500),
});

export type TempoCandidate = z.infer<typeof tempoCandidateSchema>;

export type BeatEvent = z.infer<typeof beatEventSchema>;

export type RhythmResult = z.infer<typeof rhythmResultSchema>;
