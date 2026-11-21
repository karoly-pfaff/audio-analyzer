import type { FrameFeatures } from '../contracts/frameFeatures.ts';
import { DEFAULT_SECTION_SETTINGS, sectionSettingsSchema } from './sectionEvents.ts';
import type {
  SectionSettings,
  SectionAnalysis,
  SectionEvent,
  NoveltyPoint,
} from './sectionEvents.ts';
import { measureNovelty } from './measureNovelty.ts';
import { selectSectionBoundaries } from './selectSectionBoundaries.ts';
import { detectChanges } from './detectChanges.ts';
import { createFeaturePrefix, meanFeatureRegion } from '../features/statistics/featureRegions.ts';
import {
  quantizeFeature,
  clampFeature,
  requireFeatureEntry,
} from '../features/statistics/featureStatistics.ts';

export function analyzeSections(
  frames: FrameFeatures,
  settings: SectionSettings = DEFAULT_SECTION_SETTINGS,
): SectionAnalysis {
  const checked = sectionSettingsSchema.parse(settings);
  const novelty = measureNovelty(frames, checked);
  const boundaries = selectSectionBoundaries(novelty, frames.durationSeconds, checked);
  const sections = createSections(frames, boundaries);
  return {
    sections,
    changes: detectChanges(novelty, frames.sourceSha256),
    sectionEnergy: createSectionEnergy(frames, sections),
    novelty,
  };
}

function createSections(
  frames: FrameFeatures,
  boundaries: readonly NoveltyPoint[],
): readonly SectionEvent[] {
  const starts = [{ frame: 0, time: 0, novelty: 0, energyDelta: 0, trendDelta: 0 }, ...boundaries];
  const prefix = createFeaturePrefix(frames.channels.energy);
  return starts.map((point, index) => {
    const end = starts[index + 1]?.time ?? frames.durationSeconds;
    const energy = quantizeFeature(
      clampFeature(meanFeatureRegion(prefix, point.frame, end * frames.featureHz)),
    );
    return {
      id: 'section-' + frames.sourceSha256.slice(0, 12) + '-' + String(point.frame),
      label: 'section-' + String(index + 1),
      start: point.time,
      end,
      energy,
      novelty: point.novelty,
      confidence: point.novelty,
      tags: sectionEnergyTags(energy),
    };
  });
}

function sectionEnergyTags(energy: number): SectionEvent['tags'] {
  if (energy < 0.25) return ['low-energy'];
  if (energy > 0.75) return ['high-energy'];
  return [];
}

function createSectionEnergy(
  frames: FrameFeatures,
  sections: readonly SectionEvent[],
): readonly number[] {
  let sectionIndex = 0;
  return frames.channels.energy.map((_, index) => {
    const next = sections[sectionIndex + 1];
    if (next && index / frames.featureHz >= next.start) sectionIndex += 1;
    // createSections supplies the initial region; advance only when the next region exists.
    return requireFeatureEntry(sections[sectionIndex]).energy;
  });
}
