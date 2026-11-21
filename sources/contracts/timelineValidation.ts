import type { AudioFeatureTimeline } from './audioFeatureTimeline.ts';

export function hasConsistentTimeline(timeline: AudioFeatureTimeline): boolean {
  return [
    hasTimelineClock(timeline),
    hasTimelineSections(timeline),
    hasTimelineRhythm(timeline),
    hasTimelineEvents(timeline),
    hasTimelineWaveform(timeline),
    hasTimelineNovelty(timeline),
    hasObservedBeats(timeline),
  ].every(Boolean);
}

function hasTimelineClock(timeline: AudioFeatureTimeline): boolean {
  const count = Math.ceil(timeline.sampleCount / timeline.hopSize);
  return (
    Math.abs(timeline.durationSeconds - timeline.sampleCount / timeline.sampleRate) < 1e-9 &&
    [...Object.values(timeline.raw), ...Object.values(timeline.channels)].every(
      (channel) => channel === null || channel.length === count,
    )
  );
}

function hasTimelineEvents(timeline: AudioFeatureTimeline): boolean {
  return [
    { events: timeline.onsets, kind: 'onset' },
    { events: timeline.beats, kind: 'beat' },
    { events: timeline.changes, kind: 'change' },
  ].every((group) =>
    hasOrderedSourceEvents(group.events, {
      prefix: group.kind + '-' + timeline.sourceSha256.slice(0, 12) + '-',
      duration: timeline.durationSeconds,
    }),
  );
}

function hasOrderedSourceEvents(
  events: readonly { id: string; time: number }[],
  context: { prefix: string; duration: number },
): boolean {
  const uniqueIds = new Set(events.map((event) => event.id));
  return (
    uniqueIds.size === events.length &&
    events.every(
      (event, index) =>
        event.id.startsWith(context.prefix) &&
        event.time < context.duration &&
        event.time > (events[index - 1]?.time ?? -1),
    )
  );
}

function hasTimelineSections(timeline: AudioFeatureTimeline): boolean {
  const boundaries =
    timeline.sections[0]?.start === 0 && timeline.sections.at(-1)?.end === timeline.durationSeconds;
  return (
    boundaries &&
    new Set(timeline.sections.map((section) => section.id)).size === timeline.sections.length &&
    timeline.sections.every(
      (section, index) =>
        hasLegalSection(timeline, index) &&
        section.start === (timeline.sections[index - 1]?.end ?? 0),
    )
  );
}

function hasObservedBeats(timeline: AudioFeatureTimeline): boolean {
  const onsets = new Map(
    timeline.onsets.map((onset) => [onset.id.replace('onset-', 'beat-'), onset.time]),
  );
  return timeline.beats.every(
    (beat) => onsets.get(beat.id) === beat.time && beat.confidence <= timeline.rhythm.confidence,
  );
}

function hasTimelineNovelty(timeline: AudioFeatureTimeline): boolean {
  return (
    timeline.novelty.length === Math.ceil(timeline.durationSeconds * 2) &&
    timeline.novelty.every(
      (point, index) =>
        point.frame < timeline.raw.rms.length &&
        point.time === point.frame / timeline.featureHz &&
        point.time > (timeline.novelty[index - 1]?.time ?? -1),
    )
  );
}

function hasLegalSection(timeline: AudioFeatureTimeline, index: number): boolean {
  const section = timeline.sections[index];
  if (!section?.id.startsWith('section-' + timeline.sourceSha256.slice(0, 12) + '-')) return false;
  const minimum = Math.min(
    timeline.durationSeconds,
    timeline.settings.sections.minimumRegionSeconds,
  );
  return section.end - section.start >= minimum && section.label === 'section-' + String(index + 1);
}

function hasTimelineRhythm(timeline: AudioFeatureTimeline): boolean {
  if (timeline.rhythm.bpm === null)
    return timeline.beats.length === 0 && timeline.channels.beatPhase === null;
  return (
    timeline.rhythm.confidence >= timeline.settings.rhythm.minimumConfidence &&
    !timeline.rhythm.ambiguous &&
    timeline.beats.length >= 4
  );
}

function hasTimelineWaveform(timeline: AudioFeatureTimeline): boolean {
  const count = Math.ceil(timeline.sampleCount / timeline.waveform.samplesPerPeak);
  return (
    timeline.waveform.minimum.length === count &&
    timeline.waveform.maximum.length === count &&
    timeline.waveform.minimum.every(
      (minimum, index) => minimum <= (timeline.waveform.maximum[index] ?? -Infinity),
    )
  );
}
