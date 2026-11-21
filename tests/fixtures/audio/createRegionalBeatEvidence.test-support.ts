import type { FrameFeatures, OnsetEvent } from '@karoly-pfaff/audio-analyzer';
import { createDirectorTimelineFixture } from './createDirectorTimeline.test-support.ts';
import { frameFeaturesSchema } from '@karoly-pfaff/audio-analyzer';

/** Disconnected rhythmic passages, actual gaps and a slower final passage. */
export function createRegionalBeatEvidence(): {
  readonly frames: FrameFeatures;
  readonly onsets: readonly OnsetEvent[];
} {
  const template = createDirectorTimelineFixture(64);
  const flux = Array.from({ length: Math.ceil(64 * template.featureHz) }, () => 0);
  for (const [start, end, framesPerBeat] of [
    [2, 16, 30],
    [24, 38, 30],
    [46, 62, 60],
  ] as const) {
    addObservedAccents(flux, template.featureHz, { start, end, framesPerBeat });
  }
  const onsets: readonly OnsetEvent[] = flux.flatMap((strength, frame) =>
    strength > 0
      ? [
          {
            id: 'onset-aaaaaaaaaaaa-' + String(frame),
            time: frame / template.featureHz,
            strength,
            confidence: 1,
          },
        ]
      : [],
  );
  return {
    frames: frameFeaturesSchema.parse({
      ...Object.fromEntries(
        Object.entries(template).filter(([key]) => key in frameFeaturesSchema.shape),
      ),
      channels: Object.fromEntries(
        Object.entries(template.channels).filter(
          ([key]) => key !== 'beatPhase' && key !== 'sectionEnergy',
        ),
      ),
      raw: { ...template.raw, flux },
    }),
    onsets,
  };
}

function addObservedAccents(
  flux: number[],
  featureHz: number,
  region: { start: number; end: number; framesPerBeat: number },
): void {
  for (
    let frame = Math.round(region.start * featureHz);
    frame < region.end * featureHz;
    frame += region.framesPerBeat
  )
    flux.splice(frame, 1, 1);
}
