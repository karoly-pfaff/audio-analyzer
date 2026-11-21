import type { SignalPcm } from '../contracts/signalPcm.ts';
import { SignalAnalysisError } from '../contracts/SignalAnalysisError.ts';

/** Explicit zero padding for windows outside the source clock. */
export function signalValueAt(samples: ArrayLike<number>, index: number): number {
  return samples[index] ?? 0;
}

/** Owns scratch storage; the source channels remain available for playback and measurements. */
export function prepareMonoPcm(
  pcm: SignalPcm,
  settings: { readonly channel: 'mean' | number; readonly frameCount: number },
): Float32Array {
  if (settings.channel === 'mean')
    return Float32Array.from({ length: settings.frameCount }, (_, index) =>
      meanChannelSample(pcm.channels, index),
    );
  const selected = pcm.channels[settings.channel];
  if (!selected) throw new SignalAnalysisError('invalid-pcm');
  return selected.slice(0, settings.frameCount);
}

function meanChannelSample(channels: SignalPcm['channels'], index: number): number {
  let mean = 0;
  for (const samples of channels) mean += signalValueAt(samples, index) / channels.length;
  return mean;
}
