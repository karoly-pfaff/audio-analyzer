import type { AnalysisPcm } from '../../contracts/analysisPcm.ts';
import { AudioAnalysisError } from '../../contracts/AudioAnalysisError.ts';
import {
  FRAME_SIZE,
  HOP_SIZE,
  FEATURE_HZ,
  RAW_CHANNELS,
  frameFeaturesSchema,
} from '../../contracts/frameFeatures.ts';
import type { FrameFeatures, RawFeatureChannels } from '../../contracts/frameFeatures.ts';
import { createFeatureWindow } from './featureWindow.ts';
import { createSpectrumExtractor } from './spectrumFeatures.ts';
import { normalizeFeatureChannels } from './normalizeFeatureChannels.ts';
import { quantizeFeature } from '../statistics/featureStatistics.ts';

export function extractFrameFeatures(pcm: AnalysisPcm, sourceSha256: string): FrameFeatures {
  validateFeatureInput(pcm);
  const raw = extractRawChannels(pcm.samples);
  return frameFeaturesSchema.parse({
    schemaVersion: 1,
    sourceSha256,
    sampleRate: pcm.sampleRate,
    sampleCount: pcm.samples.length,
    durationSeconds: pcm.durationSeconds,
    frameSize: FRAME_SIZE,
    hopSize: HOP_SIZE,
    featureHz: FEATURE_HZ,
    inputPeak: pcm.inputPeak,
    normalizationGain: pcm.normalizationGain,
    raw: quantizeRawChannels(raw),
    channels: normalizeFeatureChannels(raw),
  });
}

function validateFeatureInput(pcm: AnalysisPcm) {
  if (pcm.samples.length === 0 || !pcm.samples.every(Number.isFinite))
    throw new AudioAnalysisError('invalid-pcm');
}

function extractRawChannels(samples: Float32Array): RawFeatureChannels {
  const raw: RawFeatureChannels = {
    rms: [],
    sub: [],
    bass: [],
    mid: [],
    high: [],
    centroidHz: [],
    flatness: [],
    flux: [],
  };
  const extractSpectrum = createSpectrumExtractor();
  let previous: Float32Array = new Float32Array(FRAME_SIZE / 2);
  for (let index = 0; index < Math.ceil(samples.length / HOP_SIZE); index += 1) {
    const frame = extractSpectrum(createFeatureWindow(samples, index), previous);
    for (const channel of RAW_CHANNELS) raw[channel].push(frame[channel]);
    previous = frame.magnitudes;
  }
  return raw;
}

function quantizeRawChannels(raw: RawFeatureChannels): RawFeatureChannels {
  return {
    rms: raw.rms.map(quantizeFeature),
    sub: raw.sub.map(quantizeFeature),
    bass: raw.bass.map(quantizeFeature),
    mid: raw.mid.map(quantizeFeature),
    high: raw.high.map(quantizeFeature),
    centroidHz: raw.centroidHz.map(quantizeFeature),
    flatness: raw.flatness.map(quantizeFeature),
    flux: raw.flux.map(quantizeFeature),
  };
}
