import { expect, it } from 'vitest';
import { createAnalysisPcm } from './analysisPcm.ts';
import { extractFrameFeatures } from '../features/spectrum/extractFrameFeatures.ts';
import { frameFeaturesSchema } from './frameFeatures.ts';

it('rejects truncated arrays, nonfinite channels and a mismatched sample clock', () => {
  const frames = extractFrameFeatures(createAnalysisPcm(new Float32Array(1024)), 'a'.repeat(64));
  expect(
    frameFeaturesSchema.safeParse({ ...frames, channels: { ...frames.channels, bass: [] } })
      .success,
  ).toBe(false);
  expect(frameFeaturesSchema.safeParse({ ...frames, durationSeconds: 1 }).success).toBe(false);
  expect(
    frameFeaturesSchema.safeParse({ ...frames, raw: { ...frames.raw, rms: [NaN] } }).success,
  ).toBe(false);
});
