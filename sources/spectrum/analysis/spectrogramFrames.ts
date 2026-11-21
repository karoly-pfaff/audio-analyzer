import type { SpectrumSettings } from '../contracts/spectrumSettings.ts';
import { SPECTRUM_HOP_SIZE } from '../contracts/spectrumSettings.ts';
import { Radix2Fft } from '../fft/Radix2Fft.ts';
import { HANN_WINDOW } from '../fft/spectrumWindow.ts';
import { SpectrumFrame } from './SpectrumFrame.ts';

export function analysisFrameCenter(frame: number, count: number, sampleCount: number): number {
  return count > 1 ? Math.round((frame * (sampleCount - 1)) / (count - 1)) : 0;
}

export function createSpectrogramFrames(
  samples: Float32Array,
  settings: SpectrumSettings,
): {
  readonly frames: readonly Float32Array[];
  readonly ranges: readonly { readonly first: number; readonly last: number }[];
  readonly analysisFrameCount: number;
} {
  const analysisFrameCount = Math.ceil((samples.length - 1) / SPECTRUM_HOP_SIZE) + 1;
  const count = Math.min(settings.maximumFrames, analysisFrameCount);
  const ranges = Array.from({ length: count }, (_, index) => ({
    first: Math.ceil((index * analysisFrameCount) / count),
    last: Math.ceil(((index + 1) * analysisFrameCount) / count) - 1,
  }));
  const fft = new Radix2Fft();
  const frames = ranges.map((range) =>
    collectDisplayFrame(samples, fft, { ...range, analysisFrameCount, bins: settings.bins }),
  );
  const maximum = frames.reduce((peak, frame) => Math.max(peak, frame.peak()), 0);
  return {
    frames: frames.map((frame) => frame.normalize(maximum, settings.dbFloor)),
    ranges: ranges.map((range) => ({
      first: analysisFrameCenter(range.first, analysisFrameCount, samples.length),
      last: analysisFrameCenter(range.last, analysisFrameCount, samples.length),
    })),
    analysisFrameCount,
  };
}

function collectDisplayFrame(
  samples: Float32Array,
  fft: Radix2Fft,
  range: {
    readonly first: number;
    readonly last: number;
    readonly analysisFrameCount: number;
    readonly bins: number;
  },
): SpectrumFrame {
  const frame = new SpectrumFrame(range.bins);
  for (let index = range.first; index <= range.last; index += 1) {
    const offset =
      analysisFrameCenter(index, range.analysisFrameCount, samples.length) - SPECTRUM_HOP_SIZE;
    frame.append(fft.transform(samples, offset, HANN_WINDOW));
  }
  return frame;
}
