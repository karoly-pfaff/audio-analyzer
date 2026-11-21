import {
  analyzeAudio,
  createAnalysisPcm,
  type AudioFeatureTimeline,
} from '@karoly-pfaff/audio-analyzer';
import { analyzeSignal, type SignalAnalysisSummary } from '@karoly-pfaff/audio-analyzer/signal';
import {
  analyzeSpectrum,
  DEFAULT_SPECTRUM_SETTINGS,
  type SpectrumResult,
} from '@karoly-pfaff/audio-analyzer/spectrum';
import {
  estimateQuickTempo,
  getBpmRelation,
  type QuickTempoResult,
} from '@karoly-pfaff/audio-analyzer/tempo';

const input = { channels: [new Float32Array([0, 0.5, -0.5])], sampleRate: 48000 };
const signal: SignalAnalysisSummary = analyzeSignal(input);

const spectrum: SpectrumResult = analyzeSpectrum(input, {
  ...DEFAULT_SPECTRUM_SETTINGS,
  bins: 1025,
});

const tempo: QuickTempoResult = estimateQuickTempo(input);
const bpm = tempo.status === 'estimated' ? tempo.bpm : null;

const timeline: AudioFeatureTimeline = analyzeAudio({
  pcm: createAnalysisPcm(new Float32Array(22050)),
  sourceSha256: 'a'.repeat(64),
  provenance: { pcmSha256: 'b'.repeat(64), decoderVersion: 'packed smoke v1' },
});

export const publicContracts = {
  signal,
  spectrum,
  tempo,
  bpm,
  timeline,
  relation: getBpmRelation(60, 119.9),
};
