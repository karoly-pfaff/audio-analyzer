import type { FrameFeatures } from '../contracts/frameFeatures.ts';
import type { SectionSettings, NoveltyPoint } from './sectionEvents.ts';
import { createFeaturePrefix, meanFeatureRegion } from '../features/statistics/featureRegions.ts';
import { quantizeFeature, clampFeature } from '../features/statistics/featureStatistics.ts';

interface NoveltyChannel {
  readonly prefix: readonly number[];
  readonly weight: number;
}

interface NoveltyContext {
  readonly frames: FrameFeatures;
  readonly settings: SectionSettings;
  readonly channels: readonly NoveltyChannel[];
  readonly energy: readonly number[];
}

export function measureNovelty(
  frames: FrameFeatures,
  settings: SectionSettings,
): readonly NoveltyPoint[] {
  const context = {
    frames,
    settings,
    channels: createNoveltyChannels(frames),
    energy: createFeaturePrefix(frames.channels.energy),
  };
  return Array.from({ length: Math.ceil(frames.durationSeconds * 2) }, (_, index) =>
    noveltyAtTime(context, index * 0.5),
  );
}

function createNoveltyChannels(frames: FrameFeatures): readonly NoveltyChannel[] {
  return [
    { values: frames.channels.energy, weight: 0.4 },
    { values: frames.channels.brightness, weight: 0.2 },
    { values: frames.channels.roughness, weight: 0.1 },
    { values: frames.channels.sub, weight: 0.075 },
    { values: frames.channels.bass, weight: 0.075 },
    { values: frames.channels.mid, weight: 0.075 },
    { values: frames.channels.high, weight: 0.075 },
  ].map((channel) => ({ prefix: createFeaturePrefix(channel.values), weight: channel.weight }));
}

function noveltyAtTime(context: NoveltyContext, time: number): NoveltyPoint {
  const frame = Math.min(
    context.frames.raw.rms.length - 1,
    Math.round(time * context.frames.featureHz),
  );
  const radius = context.settings.contextSeconds * context.frames.featureHz;
  const hasContext =
    time >= context.settings.contextSeconds &&
    time + context.settings.contextSeconds <= context.frames.durationSeconds;
  return {
    frame,
    time: frame / context.frames.featureHz,
    novelty: hasContext
      ? quantizeFeature(
          clampFeature(
            Math.max(
              context.channels.reduce(
                (sum, channel) =>
                  sum + Math.abs(regionDelta(channel.prefix, frame, radius)) * channel.weight,
                0,
              ),
              Math.abs(regionDelta(context.energy, frame, radius)) * 0.6,
            ),
          ),
        )
      : 0,
    energyDelta: hasContext ? quantizeFeature(regionDelta(context.energy, frame, radius)) : 0,
    trendDelta: hasContext ? quantizeFeature(regionDelta(context.energy, frame, radius * 3)) : 0,
  };
}

function regionDelta(prefix: readonly number[], frame: number, radius: number): number {
  return (
    meanFeatureRegion(prefix, frame, frame + radius) -
    meanFeatureRegion(prefix, frame - radius, frame)
  );
}
