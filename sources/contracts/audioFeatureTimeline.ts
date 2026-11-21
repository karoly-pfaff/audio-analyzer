import { z } from 'zod';
import { frameFeatureDataSchema } from './frameFeatures.ts';
import {
  analyzerVersionSchema,
  analysisSettingsSchema,
  analysisProvenanceSchema,
} from './analysisSettings.ts';
import { onsetEventSchema } from '../rhythm/onsets/onsetEvents.ts';
import { rhythmResultSchema, beatEventSchema } from '../rhythm/beats/rhythmEvents.ts';
import { sectionEventSchema, changeEventSchema } from '../sections/sectionEvents.ts';
import { waveformPeaksSchema } from '../features/envelopes/waveformPeaks.ts';
import { hasConsistentTimeline } from './timelineValidation.ts';

const NORMALIZED_VALUES = z.array(z.number().min(0).max(1)).max(155040);

const TIMELINE_SCHEMA = frameFeatureDataSchema.extend({
  analyzerVersion: analyzerVersionSchema,
  settings: analysisSettingsSchema,
  provenance: analysisProvenanceSchema,
  channels: frameFeatureDataSchema.shape.channels.extend({
    sectionEnergy: NORMALIZED_VALUES,
    beatPhase: z.array(z.number().min(0).max(1).nullable()).max(155040).nullable(),
  }),
  waveform: waveformPeaksSchema,
  onsets: z.array(onsetEventSchema).max(45000),
  rhythm: rhythmResultSchema.omit({ beats: true }),
  beats: z.array(beatEventSchema).max(22500),
  sections: z.array(sectionEventSchema).min(1).max(225),
  changes: z.array(changeEventSchema).max(225),
  novelty: z
    .array(
      z.strictObject({
        frame: z.number().int().nonnegative(),
        time: z.number().nonnegative(),
        novelty: z.number().min(0).max(1),
        energyDelta: z.number().min(-1).max(1),
        trendDelta: z.number().min(-1).max(1),
      }),
    )
    .max(3600),
});

export type AudioFeatureTimeline = z.infer<typeof TIMELINE_SCHEMA>;

export const audioFeatureTimelineSchema = TIMELINE_SCHEMA.refine(hasConsistentTimeline, {
  message: 'Timeline clock, events, regions or confidence semantics are inconsistent.',
});
