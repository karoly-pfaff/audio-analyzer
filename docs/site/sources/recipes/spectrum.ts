import {
  analyzeSpectrum,
  DEFAULT_SPECTRUM_SETTINGS,
  SPECTRUM_BIN_COUNT,
} from '@karoly-pfaff/audio-analyzer/spectrum';
import type { SpectrumResult } from '@karoly-pfaff/audio-analyzer/spectrum';

export function inspectSpectrum(input: unknown): SpectrumResult {
  return analyzeSpectrum(input, {
    ...DEFAULT_SPECTRUM_SETTINGS,
    channel: 0,
    bins: SPECTRUM_BIN_COUNT,
    maximumFrames: 16,
  });
}
