import type { SignalPcm } from '../../signal/contracts/signalPcm.ts';
import { prepareMonoPcm, signalValueAt } from '../../signal/preparation/monoPcm.ts';

/** Retains the Lab's float32 sum-then-divide order, including its intermediate rounding. */
class SpectrumChannelMix {
  private readonly samples: Float32Array;

  constructor(frameCount: number) {
    this.samples = new Float32Array(frameCount);
  }

  append(channel: Float32Array): void {
    for (let index = 0; index < this.samples.length; index += 1)
      this.samples[index] = signalValueAt(this.samples, index) + signalValueAt(channel, index);
  }

  mean(channelCount: number): Float32Array {
    if (channelCount > 1) {
      const inverse = 1 / channelCount;
      for (let index = 0; index < this.samples.length; index += 1)
        this.samples[index] = signalValueAt(this.samples, index) * inverse;
    }
    return this.samples;
  }
}

export function prepareSpectrumSamples(pcm: SignalPcm, channel: 'mean' | number): Float32Array {
  if (channel !== 'mean') return prepareMonoPcm(pcm, { channel, frameCount: pcm.frameCount });
  const mix = new SpectrumChannelMix(pcm.frameCount);
  for (const samples of pcm.channels) mix.append(samples);
  return mix.mean(pcm.channels.length);
}
