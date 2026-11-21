import type { AnalysisPcm } from './contracts/analysisPcm.ts';
import { extractFrameFeatures } from './features/spectrum/extractFrameFeatures.ts';
import { detectOnsets } from './rhythm/onsets/detectOnsets.ts';
import { smoothFrameChannels } from './features/spectrum/smoothFrameChannels.ts';
import { trackRhythm } from './rhythm/beats/trackRhythm.ts';
import { analyzeSections } from './sections/analyzeSections.ts';
import { createBeatPhase } from './rhythm/beats/createBeatPhase.ts';
import { createWaveformPeaks } from './features/envelopes/waveformPeaks.ts';
import { audioFeatureTimelineSchema } from './contracts/audioFeatureTimeline.ts';
import type { AudioFeatureTimeline } from './contracts/audioFeatureTimeline.ts';
import {
  ANALYZER_VERSION,
  analysisSettingsSchema,
  analysisProvenanceSchema,
  DEFAULT_ANALYSIS_SETTINGS,
} from './contracts/analysisSettings.ts';
import type { AnalysisProvenance, AnalysisSettings } from './contracts/analysisSettings.ts';

export interface AnalysisInput {
  readonly pcm: AnalysisPcm;
  readonly sourceSha256: string;
  readonly provenance: AnalysisProvenance;
}

export type AnalysisProgress = 'features' | 'onsets' | 'rhythm' | 'sections' | 'validating';

export function analyzeAudio(
  input: AnalysisInput,
  settings: AnalysisSettings = DEFAULT_ANALYSIS_SETTINGS,
  progress: (stage: AnalysisProgress) => void = () => undefined,
): AudioFeatureTimeline {
  const checked = analysisSettingsSchema.parse(settings);
  const frames = extractAnalysisFrames(input, progress);
  progress('onsets');
  const onsets = detectOnsets(frames, checked.onsets);
  const derived = deriveMusicalStructure(frames, onsets, { settings: checked, progress });
  progress('validating');
  return audioFeatureTimelineSchema.parse({
    ...frames,
    analyzerVersion: ANALYZER_VERSION,
    settings: checked,
    provenance: analysisProvenanceSchema.parse(input.provenance),
    channels: {
      ...smoothFrameChannels(frames, onsets),
      sectionEnergy: derived.sections.sectionEnergy,
      beatPhase: createBeatPhase(frames, derived.rhythm),
    },
    waveform: createWaveformPeaks(input.pcm),
    onsets,
    rhythm: {
      bpm: derived.rhythm.bpm,
      confidence: derived.rhythm.confidence,
      ambiguous: derived.rhythm.ambiguous,
      candidates: derived.rhythm.candidates,
    },
    beats: derived.rhythm.beats,
    sections: derived.sections.sections,
    changes: derived.sections.changes,
    novelty: derived.sections.novelty,
  });
}

function extractAnalysisFrames(input: AnalysisInput, progress: (stage: AnalysisProgress) => void) {
  progress('features');
  return extractFrameFeatures(input.pcm, input.sourceSha256);
}

function deriveMusicalStructure(
  frames: ReturnType<typeof extractFrameFeatures>,
  onsets: ReturnType<typeof detectOnsets>,
  context: { settings: AnalysisSettings; progress: (stage: AnalysisProgress) => void },
) {
  context.progress('rhythm');
  const rhythm = trackRhythm(frames, onsets, context.settings.rhythm);
  context.progress('sections');
  return { rhythm, sections: analyzeSections(frames, context.settings.sections) };
}
