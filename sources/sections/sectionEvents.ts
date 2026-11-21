import { z } from 'zod';

export const sectionSettingsSchema = z.strictObject({
  minimumRegionSeconds: z.number().min(8).max(60),
  contextSeconds: z.number().min(1).max(8),
  noveltyThreshold: z.number().min(0.05).max(1),
});

export const DEFAULT_SECTION_SETTINGS = Object.freeze({
  minimumRegionSeconds: 8,
  contextSeconds: 2,
  noveltyThreshold: 0.15,
});

export type SectionSettings = z.infer<typeof sectionSettingsSchema>;

export const sectionEventSchema = z.strictObject({
  id: z.string().regex(/^section-[a-f0-9]{12}-\d+$/),
  label: z.string().regex(/^section-\d+$/),
  start: z.number().nonnegative(),
  end: z.number().positive(),
  energy: z.number().min(0).max(1),
  novelty: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.enum(['low-energy', 'high-energy'])).max(1),
});

export const changeEventSchema = z.strictObject({
  id: z.string().regex(/^change-[a-f0-9]{12}-\d+$/),
  time: z.number().nonnegative(),
  kind: z.enum(['build', 'drop', 'calm', 'shift']),
  confidence: z.number().min(0).max(1),
});

export type SectionEvent = z.infer<typeof sectionEventSchema>;

export type ChangeEvent = z.infer<typeof changeEventSchema>;

export interface NoveltyPoint {
  readonly frame: number;
  readonly time: number;
  readonly novelty: number;
  readonly energyDelta: number;
  readonly trendDelta: number;
}

export interface SectionAnalysis {
  readonly sections: readonly SectionEvent[];
  readonly changes: readonly ChangeEvent[];
  readonly sectionEnergy: readonly number[];
  readonly novelty: readonly NoveltyPoint[];
}
