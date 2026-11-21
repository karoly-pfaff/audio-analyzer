export { estimateQuickTempo } from './tempo/estimation/quickTempo.ts';
export { TempoAnalysisError } from './tempo/contracts/TempoAnalysisError.ts';
export {
  DEFAULT_QUICK_TEMPO_SETTINGS,
  QUICK_TEMPO_VERSION,
  QUICK_TEMPO_SAMPLE_LIMIT,
  quickTempoSettingsSchema,
} from './tempo/contracts/tempoSettings.ts';
export type { QuickTempoSettings } from './tempo/contracts/tempoSettings.ts';
export type {
  QuickTempoResult,
  TempoCancellation,
  TempoConfidenceLabel,
} from './tempo/contracts/tempoResult.ts';
export {
  normalizeBpm,
  isHalfDoubleMatch,
  getBpmRelation,
  areBpmsCompatible,
} from './tempo/relationships/bpmRelations.ts';
export type { BpmRelation } from './tempo/relationships/bpmRelations.ts';
