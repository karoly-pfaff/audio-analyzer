import { copyDecodedPcm } from '../recipes/browser-pcm.ts';
import type { SignalPcm } from '@karoly-pfaff/audio-analyzer/signal';

export interface DemoSettings {
  readonly frequencyHz: number;
  readonly amplitude: number;
  readonly bpm: number;
}

export function createTone(settings: DemoSettings): ReturnType<typeof copyDecodedPcm> {
  const sampleRate = 22050;
  const channel = Float32Array.from(
    { length: sampleRate / 5 },
    (_, index) =>
      settings.amplitude * Math.sin((2 * Math.PI * settings.frequencyHz * index) / sampleRate),
  );
  const decoded = new AudioBuffer({ length: channel.length, numberOfChannels: 1, sampleRate });
  decoded.getChannelData(0).set(channel);
  return copyDecodedPcm(decoded);
}

export function createPulses(settings: DemoSettings): Pick<SignalPcm, 'sampleRate' | 'channels'> {
  const sampleRate = 22050;
  const channel = Float32Array.from({ length: sampleRate * 12 }, (_, index) => {
    const phase = (index / sampleRate) % (60 / settings.bpm);
    return (
      settings.amplitude *
      Math.exp(-phase * 70) *
      Math.sin((2 * Math.PI * 440 * index) / sampleRate)
    );
  });
  return { channels: [channel], sampleRate };
}

export async function hashPcm(samples: Float32Array): Promise<string> {
  const bytes = new Uint8Array(samples.length * 4);
  const view = new DataView(bytes.buffer);
  samples.forEach((sample, index) => {
    view.setFloat32(index * 4, sample, true);
  });
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join(
    '',
  );
}
