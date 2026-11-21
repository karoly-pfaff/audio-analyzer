import { analyzeSignal, DEFAULT_SIGNAL_SETTINGS } from '@karoly-pfaff/audio-analyzer/signal';
import type { SignalAnalysisSummary } from '@karoly-pfaff/audio-analyzer/signal';

export function measureSignal(input: unknown): SignalAnalysisSummary {
  return analyzeSignal(input, {
    ...DEFAULT_SIGNAL_SETTINGS,
    clippingThreshold: 0.999,
    silenceThreshold: 0.0001,
    maximumRegions: 200,
  });
}
