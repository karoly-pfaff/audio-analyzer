import type { BeatEvent } from '../beats/rhythmEvents.ts';

/** Keep observed timestamps, deduplicate context overlaps and reject incompatible close phases. */
export function mergeBeatObservations(
  existing: readonly BeatEvent[],
  incoming: readonly BeatEvent[],
  minimumInterval: number,
): readonly BeatEvent[] {
  const byId = new Map<string, BeatEvent>();
  for (const beat of [...existing, ...incoming]) {
    if (beat.confidence > (byId.get(beat.id)?.confidence ?? -1)) byId.set(beat.id, beat);
  }
  const ordered = [...byId.values()].sort((left, right) => left.time - right.time);
  const accepted: BeatEvent[] = [];
  for (const beat of ordered) appendCompatibleBeat(accepted, beat, minimumInterval);
  return accepted;
}

function appendCompatibleBeat(beats: BeatEvent[], beat: BeatEvent, minimumInterval: number): void {
  const previous = beats.at(-1);
  if (!previous || beat.time - previous.time >= minimumInterval) {
    beats.push(beat);
    return;
  }
  if (beat.confidence > previous.confidence) beats.splice(-1, 1, beat);
}
