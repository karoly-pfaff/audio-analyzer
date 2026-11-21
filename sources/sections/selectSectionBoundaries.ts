import type { NoveltyPoint, SectionSettings } from './sectionEvents.ts';
import { percentile } from '../features/statistics/featureStatistics.ts';

export function selectSectionBoundaries(
  points: readonly NoveltyPoint[],
  durationSeconds: number,
  settings: SectionSettings,
): readonly NoveltyPoint[] {
  const floor = Math.max(
    settings.noveltyThreshold,
    percentile(
      points.map((point) => point.novelty),
      0.5,
    ) * 1.5,
  );
  const candidates = points.filter(
    (point, index) => isNoveltyPeak(points, index) && point.novelty >= floor,
  );
  const selected: NoveltyPoint[] = [];
  for (const point of candidates.toSorted((left, right) => right.novelty - left.novelty)) {
    if (
      hasRegionSpace(
        { selected, durationSeconds, minimum: settings.minimumRegionSeconds },
        point.time,
      )
    )
      selected.push(point);
  }
  return selected.sort((left, right) => left.time - right.time);
}

function isNoveltyPeak(points: readonly NoveltyPoint[], index: number): boolean {
  const value = noveltyValueAt(points, index);
  return value > noveltyValueAt(points, index - 1) && value >= noveltyValueAt(points, index + 1);
}

function noveltyValueAt(points: readonly NoveltyPoint[], index: number): number {
  return points[index]?.novelty ?? 0;
}

function hasRegionSpace(
  context: { selected: readonly NoveltyPoint[]; durationSeconds: number; minimum: number },
  time: number,
): boolean {
  return (
    time >= context.minimum &&
    context.durationSeconds - time >= context.minimum &&
    context.selected.every((point) => Math.abs(point.time - time) >= context.minimum)
  );
}
