import type { FrameFeatures } from '../../contracts/frameFeatures.ts';
import type { RhythmSettings } from '../beats/rhythmEvents.ts';
import { requireFeatureEntry } from '../../features/statistics/featureStatistics.ts';

export interface CorrelatedTempo {
  readonly bpm: number;
  readonly correlation: number;
}

export interface TempoFrames {
  readonly featureHz: FrameFeatures['featureHz'];
  readonly raw: Pick<FrameFeatures['raw'], 'flux'>;
}

/** Remove slow loudness changes before comparing spectral attacks one period apart. */
export function correlateTempo(
  frames: TempoFrames,
  settings: RhythmSettings,
): readonly CorrelatedTempo[] {
  const envelope = centeredFlux(frames.raw.flux, Math.round(frames.featureHz / 2));
  const first = Math.ceil((60 * frames.featureHz) / settings.maximumBpm);
  const last = Math.floor((60 * frames.featureHz) / settings.minimumBpm);
  return Array.from({ length: last - first + 1 }, (_, index) => ({
    bpm: (60 * frames.featureHz) / (first + index),
    correlation: lagCorrelation(envelope, first + index),
  })).sort((left, right) => right.correlation - left.correlation);
}

function centeredFlux(flux: readonly number[], radius: number): readonly number[] {
  const prefix = [0];
  let total = 0;
  for (const value of flux) {
    total += value;
    prefix.push(total);
  }
  return flux.map((value, index) => {
    const start = Math.max(0, index - radius);
    const end = Math.min(flux.length, index + radius + 1);
    return (
      value -
      (requireFeatureEntry(prefix[end]) - requireFeatureEntry(prefix[start])) / (end - start)
    );
  });
}

function lagCorrelation(envelope: readonly number[], lag: number): number {
  const sums = { product: 0, beforePower: 0, afterPower: 0 };
  for (let index = lag; index < envelope.length; index++) {
    const before = requireFeatureEntry(envelope[index - lag]);
    const after = requireFeatureEntry(envelope[index]);
    sums.product += before * after;
    sums.beforePower += before * before;
    sums.afterPower += after * after;
  }
  return Math.max(0, sums.product / Math.max(1e-12, Math.sqrt(sums.beforePower * sums.afterPower)));
}
