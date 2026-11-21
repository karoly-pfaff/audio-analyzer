import { parseSignalPcm } from '../../signal/contracts/signalPcm.ts';
import type { SignalPcm } from '../../signal/contracts/signalPcm.ts';
import type { QuickTempoSettings } from '../contracts/tempoSettings.ts';
import { prepareMonoPcm } from '../../signal/preparation/monoPcm.ts';
import {
  DEFAULT_QUICK_TEMPO_SETTINGS,
  QUICK_TEMPO_VERSION,
  QUICK_TEMPO_SAMPLE_LIMIT,
  QUICK_TEMPO_FFT_SIZE,
  parseQuickTempoSettings,
} from '../contracts/tempoSettings.ts';
import type {
  QuickTempoResult,
  QuickTempoMetadata,
  TempoCancellation,
  TempoObservation,
} from '../contracts/tempoResult.ts';
import { runMusicTempo } from './musicTempoEstimator.ts';
import { tempoConfidenceLabel } from './tempoConfidence.ts';

const CANCELLED = Object.freeze({
  status: 'cancelled',
  schemaVersion: 1,
  analyzerVersion: QUICK_TEMPO_VERSION,
} as const);

export function estimateQuickTempo(
  input: unknown,
  settings: unknown = DEFAULT_QUICK_TEMPO_SETTINGS,
  cancellation?: TempoCancellation,
): QuickTempoResult {
  if (cancellation?.aborted) return CANCELLED;
  const pcm = parseSignalPcm(input);
  const checked = parseQuickTempoSettings(settings);
  const metadata = createTempoMetadata(pcm, checked);
  const result = estimatePreparedTempo(
    prepareMonoPcm(pcm, { channel: checked.channel, frameCount: metadata.analyzedFrameCount }),
    metadata,
  );
  return cancellation?.aborted ? CANCELLED : result;
}

function createTempoMetadata(pcm: SignalPcm, settings: QuickTempoSettings): QuickTempoMetadata {
  const frameCount = Math.min(
    pcm.frameCount,
    Math.max(1, Math.floor(settings.maximumSeconds * pcm.sampleRate)),
    QUICK_TEMPO_SAMPLE_LIMIT,
  );
  const hopSize = Math.min(QUICK_TEMPO_FFT_SIZE, Math.max(1, Math.round(pcm.sampleRate / 100)));
  return {
    schemaVersion: 1,
    analyzerVersion: QUICK_TEMPO_VERSION,
    settings,
    sampleRate: pcm.sampleRate,
    sourceFrameCount: pcm.frameCount,
    sourceDurationSeconds: pcm.durationSeconds,
    analyzedFrameCount: frameCount,
    analyzedSeconds: frameCount / pcm.sampleRate,
    truncated: frameCount < pcm.frameCount,
    fftSize: QUICK_TEMPO_FFT_SIZE,
    hopSize,
    timeStepSeconds: hopSize / pcm.sampleRate,
  };
}

function estimatePreparedTempo(
  samples: Float32Array,
  metadata: QuickTempoMetadata,
): QuickTempoResult {
  if (samples.length < QUICK_TEMPO_FFT_SIZE)
    return { ...metadata, status: 'unavailable', reason: 'insufficient-audio' };
  if (!samples.some((value) => value !== 0))
    return { ...metadata, status: 'unavailable', reason: 'silence' };
  return describeTempoObservation(runMusicTempo(samples, metadata), metadata);
}

function describeTempoObservation(
  observation: TempoObservation,
  metadata: QuickTempoMetadata,
): QuickTempoResult {
  if (observation.status !== 'estimated') return { ...metadata, ...observation };
  return {
    ...metadata,
    status: 'estimated',
    bpm: Math.round(observation.bpm * 10) / 10,
    confidenceLabel: tempoConfidenceLabel(observation.bpm),
    confidenceBasis: 'bpm-range-heuristic',
  };
}
