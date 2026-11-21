import { SPECTRUM_FFT_SIZE } from '../contracts/spectrumSettings.ts';

export const HANN_WINDOW = Float32Array.from(
  { length: SPECTRUM_FFT_SIZE },
  (_, index) => 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (SPECTRUM_FFT_SIZE - 1)),
);

export const CENTROID_WINDOW = HANN_WINDOW.map(
  (value) => 1 / SPECTRUM_FFT_SIZE + (1 - 1 / SPECTRUM_FFT_SIZE) * value,
);

function reverseBits(index: number): number {
  let reversed = 0;
  let remaining = index;
  for (let bit = 0; bit < 11; bit += 1) {
    reversed = reversed * 2 + (remaining & 1);
    remaining >>>= 1;
  }
  return reversed;
}

export const REVERSED_INDICES = Uint16Array.from({ length: SPECTRUM_FFT_SIZE }, (_, index) =>
  reverseBits(index),
);
