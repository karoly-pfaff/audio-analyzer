import type { SignalPcm } from '../contracts/signalPcm.ts';
import type { SignalSettings } from '../contracts/signalSettings.ts';
import { measureSignalWindow } from './signalWindow.ts';

export function measureDynamicRangeProxy(pcm: SignalPcm, settings: SignalSettings): number | null {
  const windowLength = Math.floor(pcm.sampleRate * settings.dynamicWindowSeconds);
  if (windowLength < 1 || pcm.frameCount < windowLength * 2) return null;
  const range = measureWindowRmsRange(pcm, {
    windowLength,
    minimumRms: settings.minimumDynamicRms,
  });
  return range.maximum > 0 ? 20 * Math.log10(range.maximum / range.minimum) : null;
}

function measureWindowRmsRange(
  pcm: SignalPcm,
  settings: { readonly windowLength: number; readonly minimumRms: number },
): { readonly minimum: number; readonly maximum: number } {
  const range = { minimum: Infinity, maximum: 0 };
  for (
    let start = 0;
    start + settings.windowLength <= pcm.frameCount;
    start += settings.windowLength
  ) {
    const { rms } = measureSignalWindow(pcm.channels, {
      start,
      end: start + settings.windowLength,
    });
    if (rms > settings.minimumRms) {
      range.minimum = Math.min(range.minimum, rms);
      range.maximum = Math.max(range.maximum, rms);
    }
  }
  return range;
}
