import type { QuickTempoSettings } from './tempoSettings.ts';

export type TempoConfidenceLabel = 'high' | 'medium' | 'low';

export type TempoObservation =
  | { readonly status: 'estimated'; readonly bpm: number }
  | { readonly status: 'unavailable'; readonly reason: 'insufficient-rhythm' }
  | { readonly status: 'failed'; readonly code: 'estimator-failed' | 'invalid-estimate' };

export interface QuickTempoMetadata {
  readonly schemaVersion: 1;
  readonly analyzerVersion: string;
  readonly settings: QuickTempoSettings;
  readonly sampleRate: number;
  readonly sourceFrameCount: number;
  readonly sourceDurationSeconds: number;
  readonly analyzedFrameCount: number;
  readonly analyzedSeconds: number;
  readonly truncated: boolean;
  readonly hopSize: number;
  readonly timeStepSeconds: number;
  readonly fftSize: 2048;
}

export interface TempoCancellation {
  readonly aborted: boolean;
}

export type QuickTempoResult =
  | { readonly status: 'cancelled'; readonly schemaVersion: 1; readonly analyzerVersion: string }
  | (QuickTempoMetadata &
      (
        | {
            readonly status: 'estimated';
            readonly bpm: number;
            readonly confidenceLabel: TempoConfidenceLabel;
            readonly confidenceBasis: 'bpm-range-heuristic';
          }
        | {
            readonly status: 'unavailable';
            readonly reason: 'insufficient-audio' | 'silence' | 'insufficient-rhythm';
          }
        | { readonly status: 'failed'; readonly code: 'estimator-failed' | 'invalid-estimate' }
      ));
