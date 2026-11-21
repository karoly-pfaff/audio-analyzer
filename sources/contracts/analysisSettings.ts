import { z } from 'zod';
import { onsetSettingsSchema, DEFAULT_ONSET_SETTINGS } from '../rhythm/onsets/onsetEvents.ts';
import { rhythmSettingsSchema, DEFAULT_RHYTHM_SETTINGS } from '../rhythm/beats/rhythmEvents.ts';
import { sectionSettingsSchema, DEFAULT_SECTION_SETTINGS } from '../sections/sectionEvents.ts';

export const ANALYZER_VERSION = 'audio-rules-1.3.0-meyda-5.6.3';

export const analyzerVersionSchema = z.enum([
  'audio-rules-1.0.0-meyda-5.6.3',
  'audio-rules-1.1.0-meyda-5.6.3',
  'audio-rules-1.2.0-meyda-5.6.3',
  ANALYZER_VERSION,
]);

export const analysisSettingsSchema = z.strictObject({
  onsets: onsetSettingsSchema,
  rhythm: rhythmSettingsSchema,
  sections: sectionSettingsSchema,
});

export const DEFAULT_ANALYSIS_SETTINGS = Object.freeze({
  onsets: DEFAULT_ONSET_SETTINGS,
  rhythm: DEFAULT_RHYTHM_SETTINGS,
  sections: DEFAULT_SECTION_SETTINGS,
});

export type AnalysisSettings = z.infer<typeof analysisSettingsSchema>;

export const analysisProvenanceSchema = z.strictObject({
  pcmSha256: z.string().regex(/^[a-f0-9]{64}$/),
  decoderVersion: z.string().min(1).max(1000),
});

export type AnalysisProvenance = z.infer<typeof analysisProvenanceSchema>;
