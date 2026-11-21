import { analyzeWorkerMessage } from '../recipes/worker.ts';
import { measureSignal } from '../recipes/signal.ts';
import { prepareWaveform } from '../recipes/envelope.ts';
import { inspectSpectrum } from '../recipes/spectrum.ts';
import { estimateTempo, compareTempos } from '../recipes/tempo.ts';
import { analyzeMusic } from '../recipes/musical.ts';
import { createTone, createPulses, hashPcm } from './synthetic-pcm.ts';
import type { DemoSettings } from './synthetic-pcm.ts';

export interface DemoResult {
  readonly summary: unknown;
  readonly plot: readonly number[];
  readonly caption: string;
}

export async function runProfile(profile: string, settings: DemoSettings): Promise<DemoResult> {
  if (profile === 'validation')
    return {
      summary: analyzeWorkerMessage({ channels: [], sampleRate: 22050 }),
      plot: [],
      caption: 'An empty channel list returns invalid-pcm.',
    };
  if (profile === 'tempo') return tempoResult(settings);
  if (profile === 'musical') return musicalResult(settings);
  const input = createTone(settings);
  if (profile === 'spectrum') {
    const spectrum = inspectSpectrum(input);
    return {
      summary: { ...spectrum, frames: '[omitted from preview]' },
      plot: Array.from(spectrum.frames[0] ?? []),
      caption: 'First reduced spectrum frame · 0–11,025 Hz · relative magnitude [0, 1]',
    };
  }
  return {
    summary: measureSignal(input),
    plot: Array.from(prepareWaveform(input).rms),
    caption: 'Original-level RMS envelope · 0–0.2 source seconds',
  };
}

function tempoResult(settings: DemoSettings): DemoResult {
  const result = estimateTempo(createPulses(settings));
  return {
    summary: { ...result, relation60To119Point9: compareTempos() },
    plot: [],
    caption:
      'Quick estimate over a 12-second synthetic pulse train; no beat positions are inferred here.',
  };
}

async function musicalResult(settings: DemoSettings): Promise<DemoResult> {
  const samples = Float32Array.from(
    { length: 22050 },
    (_, index) =>
      settings.amplitude * Math.sin((2 * Math.PI * settings.frequencyHz * index) / 22050),
  );
  const fingerprint = await hashPcm(samples);
  const timeline = analyzeMusic({
    mono22050: samples,
    sourceSha256: fingerprint,
    pcmSha256: fingerprint,
    decoderVersion: 'documentation float32-le synthetic v1',
  });
  return {
    summary: {
      analyzerVersion: timeline.analyzerVersion,
      durationSeconds: timeline.durationSeconds,
      featureHz: timeline.featureHz,
      frameCount: timeline.channels.energy.length,
      normalizationGain: timeline.normalizationGain,
      rhythm: timeline.rhythm,
      beats: timeline.beats.length,
      sections: timeline.sections,
    },
    plot: timeline.channels.energy,
    caption:
      'Normalized musical energy · 0–1 source seconds. A steady tone can have no accepted beats.',
  };
}
