import { expect, it } from 'vitest';
import { hasConsistentTimeline } from './timelineValidation.ts';
import { createDirectorTimelineFixture } from '../../tests/fixtures/audio/createDirectorTimeline.test-support.ts';

it('rejects sparse waveform maxima even when the peak count matches the sample clock', () => {
  const timeline = createDirectorTimelineFixture(20);
  expect(hasConsistentTimeline(timeline)).toBe(true);
  expect(
    hasConsistentTimeline({
      ...timeline,
      waveform: {
        ...timeline.waveform,
        maximum: new Array<number>(timeline.waveform.maximum.length),
      },
    }),
  ).toBe(false);
});

it('rejects a foreign section identity even when its duration and numbering are otherwise valid', () => {
  const timeline = createDirectorTimelineFixture(20);
  expect(
    hasConsistentTimeline({
      ...timeline,
      sections: timeline.sections.map((section) => ({ ...section, id: 'section-bbbbbbbbbbbb-0' })),
    }),
  ).toBe(false);
});
