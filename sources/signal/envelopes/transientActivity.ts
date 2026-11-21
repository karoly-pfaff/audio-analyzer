/** Display-bucket energy rises, not sample-timed musical onsets or beat evidence. */
export function createTransientActivity(rms: Float32Array): Float32Array {
  const activity = Float32Array.from(rms, (value, index) =>
    Math.max(0, value - (rms[index - 1] ?? value)),
  );
  const maximum = activity.reduce((peak, value) => Math.max(peak, value), 0);
  return activity.map((value) => (maximum > 0 ? value / maximum : 0));
}
