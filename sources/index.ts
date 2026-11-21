export { AudioAnalysisError } from './contracts/AudioAnalysisError.ts';
export {
  ANALYSIS_SAMPLE_RATE,
  MAX_ANALYSIS_SAMPLES,
  createAnalysisPcm,
} from './contracts/analysisPcm.ts';
export type { AnalysisPcm } from './contracts/analysisPcm.ts';
export { extractFrameFeatures } from './features/spectrum/extractFrameFeatures.ts';
export {
  frameFeaturesSchema,
  FRAME_SIZE,
  HOP_SIZE,
  FEATURE_HZ,
} from './contracts/frameFeatures.ts';
export type { FrameFeatures } from './contracts/frameFeatures.ts';
export { detectOnsets } from './rhythm/onsets/detectOnsets.ts';
export {
  onsetEventSchema,
  onsetSettingsSchema,
  DEFAULT_ONSET_SETTINGS,
} from './rhythm/onsets/onsetEvents.ts';
export type { OnsetEvent, OnsetSettings } from './rhythm/onsets/onsetEvents.ts';
export { smoothEnvelope } from './features/envelopes/smoothEnvelope.ts';
export type { EnvelopeSettings } from './features/envelopes/smoothEnvelope.ts';
export { createOnsetEnvelope } from './features/envelopes/createOnsetEnvelope.ts';
export { smoothFrameChannels } from './features/spectrum/smoothFrameChannels.ts';
export { trackRhythm } from './rhythm/beats/trackRhythm.ts';
export { hasObservedBeatInterval } from './rhythm/beats/observedBeatInterval.ts';
export {
  rhythmSettingsSchema,
  DEFAULT_RHYTHM_SETTINGS,
  rhythmResultSchema,
  beatEventSchema,
  tempoCandidateSchema,
} from './rhythm/beats/rhythmEvents.ts';
export type {
  RhythmSettings,
  RhythmResult,
  BeatEvent,
  TempoCandidate,
} from './rhythm/beats/rhythmEvents.ts';
export { analyzeSections } from './sections/analyzeSections.ts';
export {
  sectionSettingsSchema,
  DEFAULT_SECTION_SETTINGS,
  sectionEventSchema,
  changeEventSchema,
} from './sections/sectionEvents.ts';
export type {
  SectionSettings,
  SectionAnalysis,
  SectionEvent,
  ChangeEvent,
  NoveltyPoint,
} from './sections/sectionEvents.ts';
export {
  ANALYZER_VERSION,
  analysisSettingsSchema,
  DEFAULT_ANALYSIS_SETTINGS,
  analysisProvenanceSchema,
} from './contracts/analysisSettings.ts';
export type { AnalysisSettings, AnalysisProvenance } from './contracts/analysisSettings.ts';
export { audioFeatureTimelineSchema } from './contracts/audioFeatureTimeline.ts';
export type { AudioFeatureTimeline } from './contracts/audioFeatureTimeline.ts';
export { analyzeAudio } from './analyzeAudio.ts';
export type { AnalysisInput, AnalysisProgress } from './analyzeAudio.ts';
export { createBeatPhase } from './rhythm/beats/createBeatPhase.ts';
