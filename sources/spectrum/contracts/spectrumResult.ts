import type { SpectrumSettings } from './spectrumSettings.ts';

export interface SpectrumResult {
  readonly schemaVersion: 1;
  readonly analyzerVersion: string;
  readonly settings: SpectrumSettings;
  readonly sampleRate: number;
  readonly sourceFrameCount: number;
  readonly sourceChannelCount: number;
  readonly durationSeconds: number;
  readonly fftSize: 2048;
  readonly hopSize: number;
  readonly window: 'symmetric-hann';
  readonly padding: 'zero-outside-source';
  readonly reduction: 'maximum-per-bin';
  readonly magnitudeScale: 'global-selected-bin-relative-db-0-1';
  readonly binHz: number;
  readonly maximumFrequencyHz: number;
  readonly nyquistHz: number;
  readonly binsPerFrame: number;
  readonly numFrames: number;
  readonly analysisFrameCount: number;
  readonly frames: readonly Float32Array[];
  readonly frameRanges: readonly {
    readonly firstCenterSeconds: number;
    readonly lastCenterSeconds: number;
  }[];
  readonly centroidHz: number;
  readonly centroidWindow: 'endpoint-weighted-hann';
  readonly centroidCoverage: 'full-one-sided-spectrum';
  readonly centroidTimePolicy: 'full-windows-with-weighted-anchored-tail';
}
