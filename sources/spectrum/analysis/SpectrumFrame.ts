import { signalValueAt } from '../../signal/preparation/monoPcm.ts';

export class SpectrumFrame {
  readonly magnitudes: Float32Array;
  private maximum = 0;

  constructor(bins: number) {
    this.magnitudes = new Float32Array(bins);
  }

  append(magnitudes: Float64Array): void {
    for (let bin = 0; bin < this.magnitudes.length; bin += 1) {
      const magnitude = signalValueAt(magnitudes, bin);
      if (magnitude > signalValueAt(this.magnitudes, bin)) {
        this.magnitudes[bin] = magnitude;
        this.maximum = Math.max(this.maximum, magnitude);
      }
    }
  }

  peak(): number {
    return this.maximum;
  }

  normalize(globalMaximum: number, dbFloor: number): Float32Array {
    return this.magnitudes.map((magnitude) => {
      const linear = globalMaximum > 0 ? magnitude / globalMaximum : 0;
      const decibels = linear < 1e-10 ? dbFloor : 20 * Math.log10(linear);
      return Math.max(0, (decibels - dbFloor) / -dbFloor);
    });
  }
}
