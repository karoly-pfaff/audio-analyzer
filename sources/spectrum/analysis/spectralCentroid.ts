import { signalValueAt } from '../../signal/preparation/monoPcm.ts';
import { SPECTRUM_FFT_SIZE, SPECTRUM_HOP_SIZE } from '../contracts/spectrumSettings.ts';
import { CENTROID_WINDOW } from '../fft/spectrumWindow.ts';
import { Radix2Fft } from '../fft/Radix2Fft.ts';

class CentroidAccumulator {
  private magnitude = 0;
  private weightedBins = 0;

  append(magnitudes: Float64Array, weight: number): void {
    for (let bin = 0; bin < magnitudes.length; bin += 1) {
      const magnitude = signalValueAt(magnitudes, bin) * weight;
      this.magnitude += magnitude;
      this.weightedBins += magnitude * bin;
    }
  }

  frequencyBin(): number {
    return this.magnitude > 0 ? this.weightedBins / this.magnitude : 0;
  }
}

export function measureSpectralCentroid(samples: Float32Array): number {
  const fft = new Radix2Fft();
  const totals = new CentroidAccumulator();
  const offsets = centroidOffsets(samples.length);
  for (let offset = offsets.first; offset <= offsets.limit; offset += SPECTRUM_HOP_SIZE)
    totals.append(fft.transform(samples, offset, CENTROID_WINDOW), 1);
  appendCentroidTail(samples, { fft, totals, lastOffset: offsets.last });
  return totals.frequencyBin();
}

function centroidOffsets(sampleCount: number) {
  const first =
    sampleCount < SPECTRUM_FFT_SIZE ? Math.floor((sampleCount - SPECTRUM_FFT_SIZE) / 2) : 0;
  const last = Math.max(0, sampleCount - SPECTRUM_FFT_SIZE);
  return { first, last, limit: sampleCount < SPECTRUM_FFT_SIZE ? first : last };
}

function appendCentroidTail(
  samples: Float32Array,
  context: {
    readonly fft: Radix2Fft;
    readonly totals: CentroidAccumulator;
    readonly lastOffset: number;
  },
): void {
  const remainder = context.lastOffset % SPECTRUM_HOP_SIZE;
  if (samples.length >= SPECTRUM_FFT_SIZE && remainder > 0)
    context.totals.append(
      context.fft.transform(samples, context.lastOffset, CENTROID_WINDOW),
      remainder / SPECTRUM_HOP_SIZE,
    );
}
