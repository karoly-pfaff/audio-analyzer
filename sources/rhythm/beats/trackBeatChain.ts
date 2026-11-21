import type { OnsetEvent } from '../onsets/onsetEvents.ts';
import {
  clampFeature,
  quantizeFeature,
  requireFeatureEntry,
} from '../../features/statistics/featureStatistics.ts';
import type { TempoCandidate } from './rhythmEvents.ts';

interface ChainNode {
  readonly onset: OnsetEvent;
  readonly previous: number;
  readonly score: number;
}

export interface BeatChain {
  readonly candidate: TempoCandidate;
  readonly onsets: readonly OnsetEvent[];
}

interface ChainContext {
  readonly nodes: readonly ChainNode[];
  readonly period: number;
}

export function trackBeatChain(onsets: readonly OnsetEvent[], bpm: number): BeatChain {
  const nodes: ChainNode[] = [];
  const context = { nodes, period: 60 / bpm };
  for (const onset of onsets) nodes.push(bestPredecessor(context, onset));
  const chain = traceChain(nodes);
  return { candidate: measureChain(onsets, chain, bpm), onsets: chain };
}

function bestPredecessor(context: ChainContext, onset: OnsetEvent): ChainNode {
  let best = { previous: -1, score: onset.strength, onset };
  for (let previous = context.nodes.length - 1; previous >= 0; previous -= 1) {
    // This index is bounded by the same append-only node array; every node owns its onset.
    const node = requireFeatureEntry(context.nodes[previous]);
    const gap = onset.time - node.onset.time;
    if (gap > context.period * 3.2) break;
    const score = predecessorScore(context, { previous: node, gap, strength: onset.strength });
    if (score > best.score) best = { previous, score, onset };
  }
  return best;
}

function predecessorScore(
  context: ChainContext,
  edge: { previous: ChainNode; gap: number; strength: number },
): number {
  const steps = Math.round(edge.gap / context.period);
  const error = Math.abs(edge.gap / context.period - steps);
  if (steps < 1 || steps > 3 || error > 0.14) return -Infinity;
  return edge.previous.score * 0.999 + edge.strength - error * 2 - (steps - 1) * 0.12;
}

function traceChain(nodes: readonly ChainNode[]): readonly OnsetEvent[] {
  let node = nodes.reduce<ChainNode | undefined>(
    (best, candidate) => (candidate.score > (best?.score ?? 0) ? candidate : best),
    undefined,
  );
  const chain: OnsetEvent[] = [];
  while (node) {
    chain.push(node.onset);
    node = nodes[node.previous];
  }
  return chain.reverse();
}

function measureChain(
  onsets: readonly OnsetEvent[],
  chain: readonly OnsetEvent[],
  bpm: number,
): TempoCandidate {
  const coverage =
    chain.reduce((sum, onset) => sum + onset.strength, 0) /
    Math.max(
      1e-12,
      onsets.reduce((sum, onset) => sum + onset.strength, 0),
    );
  const extent = (chain.at(-1)?.time ?? 0) - (chain[0]?.time ?? 0);
  const continuity = clampFeature((chain.length - 1) / Math.max(1, (extent * bpm) / 60));
  const evidence = Math.min(1, chain.length / 8);
  const timing = chainTimingFitness(chain, 60 / bpm);
  return {
    bpm: quantizeFeature(bpm),
    coverage: quantizeFeature(coverage),
    continuity: quantizeFeature(continuity),
    timing: quantizeFeature(timing),
    score: quantizeFeature(clampFeature(Math.sqrt(coverage * continuity * timing) * evidence)),
  };
}

function chainTimingFitness(chain: readonly OnsetEvent[], period: number): number {
  let previous = chain[0]?.time ?? 0;
  let fitness = 0;
  for (const onset of chain.slice(1)) {
    const gap = (onset.time - previous) / period;
    const error = gap - Math.round(gap);
    fitness += Math.exp(-0.5 * (error / 0.05) ** 2);
    previous = onset.time;
  }
  return fitness / Math.max(1, chain.length - 1);
}

export function refineChainTempo(chain: BeatChain): number {
  const period = 60 / chain.candidate.bpm;
  let previous = chain.onsets[0]?.time ?? 0;
  let steps = 0;
  for (const onset of chain.onsets.slice(1)) {
    steps += Math.max(1, Math.round((onset.time - previous) / period));
    previous = onset.time;
  }
  const extent = chainExtent(chain.onsets);
  return extent > 0 ? (60 * steps) / extent : chain.candidate.bpm;
}

function chainExtent(onsets: readonly OnsetEvent[]): number {
  return (onsets.at(-1)?.time ?? 0) - (onsets[0]?.time ?? 0);
}
