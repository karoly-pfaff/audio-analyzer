import type { OnsetEvent } from '../onsets/onsetEvents.ts';
import { quantizeFeature } from '../../features/statistics/featureStatistics.ts';

/** Timing reliability is independent of loudness; skipped beats are never fabricated. */
export function observedBeatConfidence(
  chain: readonly OnsetEvent[],
  index: number,
  rhythm: { bpm: number; confidence: number },
): number {
  const onset = chain[index];
  if (!onset) return 0;
  const period = 60 / rhythm.bpm;
  const support =
    (edgeSupport(chain[index - 1], onset, period) + edgeSupport(onset, chain[index + 1], period)) /
    2;
  return quantizeFeature(rhythm.confidence * (0.6 + 0.4 * support));
}

function edgeSupport(
  before: OnsetEvent | undefined,
  after: OnsetEvent | undefined,
  period: number,
) {
  if (!before || !after) return 0;
  const error = (after.time - before.time) / period - 1;
  return Math.abs(error) <= 0.14 ? Math.exp(-0.5 * (error / 0.08) ** 2) : 0;
}
