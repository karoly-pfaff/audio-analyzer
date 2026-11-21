import { FRAME_SIZE, HOP_SIZE } from '../../contracts/frameFeatures.ts';

/** Centered at the exact sample clock, with zero padding only outside the source. */
export function createFeatureWindow(samples: Float32Array, index: number): Float32Array {
  const window = new Float32Array(FRAME_SIZE);
  const start = index * HOP_SIZE - FRAME_SIZE / 2;
  const first = Math.max(0, start);
  const last = Math.min(samples.length, start + FRAME_SIZE);
  window.set(samples.subarray(first, last), first - start);
  return window;
}

export function windowRms(window: Float32Array): number {
  let power = 0;
  for (const sample of window) power += sample * sample;
  return Math.sqrt(power / FRAME_SIZE);
}
