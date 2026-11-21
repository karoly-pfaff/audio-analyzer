import { parseSignalPcm } from '../../signal/contracts/signalPcm.ts';
import type { SignalPcm } from '../../signal/contracts/signalPcm.ts';
import { prepareSpectrumSamples } from './SpectrumChannelMix.ts';
import {
  DEFAULT_SPECTRUM_SETTINGS,
  parseSpectrumSettings,
  SPECTRUM_ANALYZER_VERSION,
  SPECTRUM_FFT_SIZE,
  SPECTRUM_HOP_SIZE,
} from '../contracts/spectrumSettings.ts';
import type { SpectrumResult } from '../contracts/spectrumResult.ts';
import type { SpectrumSettings } from '../contracts/spectrumSettings.ts';
import { measureSpectralCentroid } from './spectralCentroid.ts';
import { createSpectrogramFrames } from './spectrogramFrames.ts';

export function analyzeSpectrum(
  input: unknown,
  settings: unknown = DEFAULT_SPECTRUM_SETTINGS,
): SpectrumResult {
  const pcm = parseSignalPcm(input);
  const checked = parseSpectrumSettings(settings);
  const samples = prepareSpectrumSamples(pcm, checked.channel);
  const spectrogram = createSpectrogramFrames(samples, checked);
  return {
    ...createSpectrumMetadata(pcm, checked),
    numFrames: spectrogram.frames.length,
    analysisFrameCount: spectrogram.analysisFrameCount,
    frames: spectrogram.frames,
    frameRanges: spectrogram.ranges.map((range) => ({
      firstCenterSeconds: range.first / pcm.sampleRate,
      lastCenterSeconds: range.last / pcm.sampleRate,
    })),
    centroidHz: (measureSpectralCentroid(samples) * pcm.sampleRate) / SPECTRUM_FFT_SIZE,
  };
}

function createSpectrumMetadata(pcm: SignalPcm, settings: SpectrumSettings) {
  return {
    schemaVersion: 1,
    analyzerVersion: SPECTRUM_ANALYZER_VERSION,
    settings,
    sampleRate: pcm.sampleRate,
    sourceFrameCount: pcm.frameCount,
    sourceChannelCount: pcm.channels.length,
    durationSeconds: pcm.durationSeconds,
    fftSize: SPECTRUM_FFT_SIZE,
    hopSize: SPECTRUM_HOP_SIZE,
    window: 'symmetric-hann',
    padding: 'zero-outside-source',
    reduction: 'maximum-per-bin',
    magnitudeScale: 'global-selected-bin-relative-db-0-1',
    binHz: pcm.sampleRate / SPECTRUM_FFT_SIZE,
    maximumFrequencyHz: ((settings.bins - 1) * pcm.sampleRate) / SPECTRUM_FFT_SIZE,
    nyquistHz: pcm.sampleRate / 2,
    binsPerFrame: settings.bins,
    centroidWindow: 'endpoint-weighted-hann',
    centroidCoverage: 'full-one-sided-spectrum',
    centroidTimePolicy: 'full-windows-with-weighted-anchored-tail',
  } as const;
}
