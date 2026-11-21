export { SignalAnalysisError } from './signal/contracts/SignalAnalysisError.ts';
export { SIGNAL_PCM_LIMITS, parseSignalPcm } from './signal/contracts/signalPcm.ts';
export type { SignalPcm } from './signal/contracts/signalPcm.ts';
export {
  DEFAULT_SIGNAL_SETTINGS,
  SIGNAL_ANALYZER_VERSION,
  signalSettingsSchema,
} from './signal/contracts/signalSettings.ts';
export type { SignalSettings } from './signal/contracts/signalSettings.ts';
export type {
  SignalAnalysisSummary,
  SignalSampleMetrics,
  SignalRegion,
  SignalRegionSummary,
} from './signal/contracts/signalSummary.ts';
export { analyzeSignal } from './signal/statistics/analyzeSignal.ts';
export { createSignalEnvelope } from './signal/envelopes/signalEnvelope.ts';
export type { SignalEnvelope } from './signal/envelopes/signalEnvelope.ts';
