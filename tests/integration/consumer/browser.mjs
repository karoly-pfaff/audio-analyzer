import { analyzeSignal } from '@karoly-pfaff/audio-analyzer/signal';
import { analyzeSpectrum } from '@karoly-pfaff/audio-analyzer/spectrum';
import { estimateQuickTempo, getBpmRelation } from '@karoly-pfaff/audio-analyzer/tempo';

const input = { channels: [new Float32Array([0, 0.5, -0.5])], sampleRate: 48000 };

globalThis.analyzerSmoke = {
  signal: analyzeSignal(input),
  spectrum: analyzeSpectrum(input),
  tempo: estimateQuickTempo(input),
  relation: getBpmRelation(60, 119.9),
};
