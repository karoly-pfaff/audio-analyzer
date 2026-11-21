import { frameFeaturesSchema } from '@karoly-pfaff/audio-analyzer';
import type { FrameFeatures, OnsetEvent } from '@karoly-pfaff/audio-analyzer';
import { createDirectorTimelineFixture } from './createDirectorTimeline.test-support.ts';

/** Frame-domain percussion: regular accents amid unrelated, weaker subdivisions. */
export function createDenseBeatEvidence(): {
  readonly frames: FrameFeatures;
  readonly onsets: readonly OnsetEvent[];
} {
  const template = createDirectorTimelineFixture(24);
  const flux = template.raw.flux.map(() => 0);
  const accents = Array.from(
    { length: 60 },
    (_, index) => Math.round(0.5 * template.featureHz) + index * 30,
  );
  for (const frame of accents) flux[frame] = 1;
  let seed = 71;
  for (let index = 0; index < 500; index++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const frame = seed % flux.length;
    if (accents.every((accent) => Math.abs(frame - accent) > 3)) flux[frame] = 0.3;
  }
  const { channels, raw, ...clock } = template;
  const frames = frameFeaturesSchema.parse({
    ...Object.fromEntries(
      Object.entries(clock).filter(([key]) => key in frameFeaturesSchema.shape),
    ),
    channels: Object.fromEntries(
      Object.entries(channels).filter(([key]) => key !== 'beatPhase' && key !== 'sectionEnergy'),
    ),
    raw: { ...raw, flux },
  });
  const onsets = flux.flatMap((strength, frame) =>
    strength > 0
      ? [
          {
            id: 'onset-aaaaaaaaaaaa-' + String(frame),
            time: frame / frames.featureHz,
            strength,
            confidence: 1,
          },
        ]
      : [],
  );
  return { frames, onsets };
}
