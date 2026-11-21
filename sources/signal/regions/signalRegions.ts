import type { SignalPcm } from '../contracts/signalPcm.ts';
import type { SignalRegionSummary } from '../contracts/signalSummary.ts';
import { measureSignalWindow } from './signalWindow.ts';
import { SignalRegionCollector } from './SignalRegionCollector.ts';

interface RegionSettings {
  readonly kind: 'silence' | 'clipping';
  readonly threshold: number;
  readonly windowSeconds: number;
  readonly maximumRegions: number;
}

export function findSignalRegions(pcm: SignalPcm, settings: RegionSettings): SignalRegionSummary {
  const windowLength = Math.max(1, Math.floor(pcm.sampleRate * settings.windowSeconds));
  const collector = new SignalRegionCollector({
    sampleRate: pcm.sampleRate,
    maximumRegions: settings.maximumRegions,
  });
  for (let offset = 0; offset < pcm.frameCount; offset += windowLength) {
    const window = measureSignalWindow(pcm.channels, {
      start: offset,
      end: Math.min(pcm.frameCount, offset + windowLength),
    });
    collector.observe(
      hasRegionAmplitude(Math.max(-window.minimum, window.maximum), settings),
      offset,
    );
  }
  return collector.finish(pcm.frameCount);
}

function hasRegionAmplitude(amplitude: number, settings: RegionSettings): boolean {
  return settings.kind === 'silence'
    ? amplitude < settings.threshold
    : amplitude >= settings.threshold;
}
