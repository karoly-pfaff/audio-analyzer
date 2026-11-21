export { analyzeSpectrum } from './spectrum/analysis/analyzeSpectrum.ts';
export { SpectrumAnalysisError } from './spectrum/contracts/SpectrumAnalysisError.ts';
export {
  DEFAULT_SPECTRUM_SETTINGS,
  SPECTRUM_ANALYZER_VERSION,
  SPECTRUM_FFT_SIZE,
  SPECTRUM_HOP_SIZE,
  SPECTRUM_BIN_COUNT,
  spectrumSettingsSchema,
} from './spectrum/contracts/spectrumSettings.ts';
export type { SpectrumSettings } from './spectrum/contracts/spectrumSettings.ts';
export type { SpectrumResult } from './spectrum/contracts/spectrumResult.ts';
