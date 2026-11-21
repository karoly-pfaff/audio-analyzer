export interface SignalSampleWindow {
  readonly start: number;
  readonly end: number;
}

export function measureSignalWindow(
  channels: readonly Float32Array[],
  window: SignalSampleWindow,
): { readonly minimum: number; readonly maximum: number; readonly rms: number } {
  const totals = { minimum: 0, maximum: 0, squares: 0 };
  for (const samples of channels) {
    for (const sample of samples.subarray(window.start, window.end)) {
      totals.minimum = Math.min(totals.minimum, sample);
      totals.maximum = Math.max(totals.maximum, sample);
      totals.squares += sample * sample;
    }
  }
  return {
    minimum: totals.minimum,
    maximum: totals.maximum,
    rms: Math.sqrt(totals.squares / ((window.end - window.start) * channels.length)),
  };
}
