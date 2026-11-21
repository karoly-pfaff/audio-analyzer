import type { NoveltyPoint, ChangeEvent } from './sectionEvents.ts';
import { clampFeature, quantizeFeature } from '../features/statistics/featureStatistics.ts';

export function detectChanges(
  points: readonly NoveltyPoint[],
  sourceSha256: string,
): readonly ChangeEvent[] {
  const changes: ChangeEvent[] = [];
  let activeKind: ChangeEvent['kind'] | null = null;
  for (const point of points) {
    const kind = candidateChangeKind(point);
    if (kind)
      appendChange(changes, createChangeEvent(point, kind, sourceSha256), kind !== activeKind);
    activeKind = kind;
  }
  return changes;
}

function appendChange(changes: ChangeEvent[], event: ChangeEvent, fresh: boolean) {
  const previous = changes.at(-1);
  if (!previous || event.time - previous.time >= 8) {
    if (fresh) changes.push(event);
    return;
  }
  if (event.confidence > previous.confidence) changes.splice(-1, 1, event);
}

function candidateChangeKind(point: NoveltyPoint): ChangeEvent['kind'] | null {
  if (point.energyDelta > 0.25) return 'drop';
  if (point.energyDelta < -0.25) return 'calm';
  if (point.trendDelta > 0.18 && point.energyDelta > 0.04) return 'build';
  if (point.novelty > 0.2) return 'shift';
  return null;
}

function createChangeEvent(
  point: NoveltyPoint,
  kind: ChangeEvent['kind'],
  sourceSha256: string,
): ChangeEvent {
  return {
    id: 'change-' + sourceSha256.slice(0, 12) + '-' + String(point.frame),
    time: point.time,
    kind,
    confidence: quantizeFeature(
      clampFeature(
        Math.max(point.novelty, Math.abs(point.energyDelta), Math.abs(point.trendDelta)),
      ),
    ),
  };
}
