import { SPECTRUM_FFT_SIZE, SPECTRUM_BIN_COUNT } from '../contracts/spectrumSettings.ts';
import { SpectrumAnalysisError } from '../contracts/SpectrumAnalysisError.ts';
import { REVERSED_INDICES } from './spectrumWindow.ts';

// Local indexed reads preserve zero padding without module-proxy calls or butterfly allocation.
export class Radix2Fft {
  private readonly real = new Float32Array(SPECTRUM_FFT_SIZE);
  private readonly imaginary = new Float32Array(SPECTRUM_FFT_SIZE);
  private readonly magnitudes = new Float64Array(SPECTRUM_BIN_COUNT);
  private phaseReal = 1;
  private phaseImaginary = 0;
  private rotationReal = 1;
  private rotationImaginary = 0;

  /** Returned magnitudes borrow scratch storage until the next transform. */
  transform(samples: Float32Array, offset: number, window: Float32Array): Float64Array {
    this.prepare(samples, offset, window);
    this.reorder();
    for (let length = 2; length <= SPECTRUM_FFT_SIZE; length *= 2) this.applyPass(length);
    return this.measureMagnitudes();
  }

  private prepare(samples: Float32Array, offset: number, window: Float32Array): void {
    this.imaginary.fill(0);
    for (let index = 0; index < SPECTRUM_FFT_SIZE; index += 1)
      this.real[index] = fftValueAt(samples, offset + index) * fftValueAt(window, index);
  }

  private reorder(): void {
    for (let index = 1; index < SPECTRUM_FFT_SIZE; index += 1) {
      const reversed = fftValueAt(REVERSED_INDICES, index);
      if (index < reversed) this.swap(index, reversed);
    }
  }

  private swap(first: number, last: number): void {
    const originalReal = fftValueAt(this.real, first);
    const originalImaginary = fftValueAt(this.imaginary, first);
    this.real[first] = fftValueAt(this.real, last);
    this.imaginary[first] = fftValueAt(this.imaginary, last);
    this.real[last] = originalReal;
    this.imaginary[last] = originalImaginary;
  }

  private applyPass(length: number): void {
    const angle = (-2 * Math.PI) / length;
    this.rotationReal = Math.cos(angle);
    this.rotationImaginary = Math.sin(angle);
    for (let start = 0; start < SPECTRUM_FFT_SIZE; start += length)
      this.applyGroup(start, length / 2);
  }

  private applyGroup(start: number, half: number): void {
    this.phaseReal = 1;
    this.phaseImaginary = 0;
    for (let offset = 0; offset < half; offset += 1) {
      this.applyButterfly(start + offset, start + offset + half);
      this.advancePhase();
    }
  }

  private advancePhase(): void {
    const nextReal =
      this.phaseReal * this.rotationReal - this.phaseImaginary * this.rotationImaginary;
    this.phaseImaginary =
      this.phaseReal * this.rotationImaginary + this.phaseImaginary * this.rotationReal;
    this.phaseReal = nextReal;
  }

  private applyButterfly(first: number, last: number): void {
    const originalReal = fftValueAt(this.real, first);
    const originalImaginary = fftValueAt(this.imaginary, first);
    const rotatedReal =
      fftValueAt(this.real, last) * this.phaseReal -
      fftValueAt(this.imaginary, last) * this.phaseImaginary;
    const rotatedImaginary =
      fftValueAt(this.real, last) * this.phaseImaginary +
      fftValueAt(this.imaginary, last) * this.phaseReal;
    this.real[first] = originalReal + rotatedReal;
    this.imaginary[first] = originalImaginary + rotatedImaginary;
    this.real[last] = originalReal - rotatedReal;
    this.imaginary[last] = originalImaginary - rotatedImaginary;
  }

  private measureMagnitudes(): Float64Array {
    for (let bin = 0; bin < SPECTRUM_BIN_COUNT; bin += 1) {
      const magnitude = Math.hypot(fftValueAt(this.real, bin), fftValueAt(this.imaginary, bin));
      if (!Number.isFinite(Math.fround(magnitude)))
        throw new SpectrumAnalysisError('numeric-overflow');
      this.magnitudes[bin] = magnitude;
    }
    return this.magnitudes;
  }
}

function fftValueAt(samples: ArrayLike<number>, index: number): number {
  return samples[index] ?? 0;
}
