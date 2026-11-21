import type { SignalSettings } from './signalSettings.ts';

export interface SignalRegion {
  readonly startSeconds: number;
  readonly endSeconds: number;
}

export interface SignalRegionSummary {
  readonly regions: readonly SignalRegion[];
  readonly regionCount: number;
  readonly regionsTruncated: boolean;
  readonly longestRegionSeconds: number;
}

export interface SignalSampleMetrics {
  readonly peakAmplitude: number;
  readonly peakDb: number | null;
  readonly rmsAmplitude: number;
  readonly rmsDb: number | null;
  readonly crestFactorDb: number | null;
  readonly dcOffset: number;
  readonly clippedSampleCount: number;
  readonly clippedSampleRatio: number;
  readonly clippingRisk: 'none' | 'low' | 'medium' | 'high';
  readonly silentSampleRatio: number;
}

export interface SignalAnalysisSummary extends SignalSampleMetrics {
  readonly schemaVersion: 1;
  readonly analyzerVersion: string;
  readonly settings: SignalSettings;
  readonly durationSeconds: number;
  readonly sampleRate: number;
  readonly frameCount: number;
  readonly channelCount: number;
  readonly channelMetrics: readonly SignalSampleMetrics[];
  readonly dynamicRangeProxyDb: number | null;
  readonly silence: SignalRegionSummary;
  readonly clipping: SignalRegionSummary;
}
