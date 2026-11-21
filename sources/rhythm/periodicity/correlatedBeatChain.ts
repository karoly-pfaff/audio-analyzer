import type { FrameFeatures } from '../../contracts/frameFeatures.ts';
import type { OnsetEvent } from '../onsets/onsetEvents.ts';
import type { RhythmSettings } from '../beats/rhythmEvents.ts';
import {
  quantizeFeature,
  requireFeatureEntry,
} from '../../features/statistics/featureStatistics.ts';
import { correlateTempo } from './tempoCorrelation.ts';
import { trackBeatChain, refineChainTempo } from '../beats/trackBeatChain.ts';
import type { BeatChain } from '../beats/trackBeatChain.ts';

interface BeatEvidence {
  readonly chain: BeatChain;
  readonly confidence: number;
}

/** Dense subdivisions dilute onset coverage; require independent periodic frame evidence. */
export function findCorrelatedBeatEvidence(
  frames: FrameFeatures,
  onsets: readonly OnsetEvent[],
  settings: RhythmSettings,
): BeatEvidence | null {
  const best = selectPeriodicTempo(frames, settings);
  if (!best) return null;
  const observed = trackBeatChain(onsets, best.bpm);
  const bpm = refineChainTempo(observed);
  if (bpm < settings.minimumBpm || bpm > settings.maximumBpm) return null;
  const chain = trackBeatChain(onsets, bpm);
  const confidence = supportedChainConfidence(chain, best.correlation);
  return confidence >= settings.minimumConfidence ? { chain, confidence } : null;
}

function selectPeriodicTempo(frames: FrameFeatures, settings: RhythmSettings) {
  const tempos = correlateTempo(frames, settings);
  const best = tempos[0];
  if (!best || best.correlation < 0.6) return null;
  const competitor = tempos.find((tempo) => !hasRelatedPeriod(tempo.bpm / best.bpm));
  const margin = best.correlation - (competitor?.correlation ?? 0);
  return margin >= 0.1 ? best : null;
}

function hasRelatedPeriod(ratio: number): boolean {
  return [1 / 3, 0.5, 1, 2, 3].some((multiple) => Math.abs(ratio / multiple - 1) < 0.06);
}

function supportedChainConfidence(chain: BeatChain, correlation: number): number {
  const extent = observedExtent(chain.onsets);
  const support = chain.candidate.continuity * chain.candidate.timing;
  if (chain.onsets.length < 16 || extent < 8 || support < 0.8) return 0;
  return quantizeFeature(Math.sqrt(correlation * support));
}

function observedExtent(onsets: readonly OnsetEvent[]): number {
  if (onsets.length === 0) return 0;
  return requireFeatureEntry(onsets.at(-1)).time - requireFeatureEntry(onsets[0]).time;
}
