import { observedBeatConfidence } from './observedBeatConfidence.ts';
import type { FrameFeatures } from '../../contracts/frameFeatures.ts';
import type { OnsetEvent } from '../onsets/onsetEvents.ts';
import { onsetEventSchema } from '../onsets/onsetEvents.ts';
import { AudioAnalysisError } from '../../contracts/AudioAnalysisError.ts';
import { clampFeature, quantizeFeature } from '../../features/statistics/featureStatistics.ts';
import {
  DEFAULT_RHYTHM_SETTINGS,
  rhythmSettingsSchema,
  rhythmResultSchema,
} from './rhythmEvents.ts';
import type { RhythmResult, RhythmSettings, TempoCandidate } from './rhythmEvents.ts';
import { trackBeatChain, refineChainTempo } from './trackBeatChain.ts';
import type { BeatChain } from './trackBeatChain.ts';
import { findCorrelatedBeatEvidence } from '../periodicity/correlatedBeatChain.ts';
import { extendObservedBeatTrack } from '../tracking/regionalBeatTrack.ts';

export function trackRhythm(
  frames: FrameFeatures,
  onsets: readonly OnsetEvent[],
  settings: RhythmSettings = DEFAULT_RHYTHM_SETTINGS,
): RhythmResult {
  const checked = rhythmSettingsSchema.parse(settings);
  validateRhythmOnsets(frames, onsets);
  const candidates = findTempoChains(onsets, checked);
  const correlated =
    rhythmConfidence(candidates) < checked.minimumConfidence &&
    candidates[0] &&
    candidates[0].candidate.coverage < 0.5
      ? findCorrelatedBeatEvidence(frames, onsets, checked)
      : null;
  const rhythm = createRhythmResult(candidates, correlated, checked.minimumConfidence);
  return extendObservedBeatTrack(frames, onsets, { rhythm, settings: checked });
}

function createRhythmResult(
  candidates: readonly BeatChain[],
  correlated: ReturnType<typeof findCorrelatedBeatEvidence>,
  minimumConfidence: number,
): RhythmResult {
  const { best, confidence } = selectRhythmEvidence(candidates, correlated);
  const reliable = best && confidence >= minimumConfidence;
  return rhythmResultSchema.parse({
    bpm: reliable ? best.candidate.bpm : null,
    confidence,
    ambiguous: Boolean(best && confidence < minimumConfidence),
    candidates: candidates.map((chain) => chain.candidate),
    beats: reliable
      ? best.onsets.map((onset, index) => ({
          id: onset.id.replace('onset-', 'beat-'),
          time: onset.time,
          confidence: observedBeatConfidence(best.onsets, index, {
            bpm: best.candidate.bpm,
            confidence,
          }),
        }))
      : [],
  });
}

function selectRhythmEvidence(
  candidates: readonly BeatChain[],
  correlated: ReturnType<typeof findCorrelatedBeatEvidence>,
) {
  if (correlated) return { best: correlated.chain, confidence: correlated.confidence };
  return { best: candidates[0], confidence: rhythmConfidence(candidates) };
}

function validateRhythmOnsets(frames: FrameFeatures, onsets: readonly OnsetEvent[]): void {
  let previous = -1;
  for (const onset of onsets) {
    if (
      !onsetEventSchema.safeParse(onset).success ||
      onset.time <= previous ||
      onset.time >= frames.durationSeconds ||
      !onset.id.startsWith('onset-' + frames.sourceSha256.slice(0, 12) + '-')
    )
      throw new AudioAnalysisError('analysis-failed');
    previous = onset.time;
  }
}

function findTempoChains(
  onsets: readonly OnsetEvent[],
  settings: RhythmSettings,
): readonly BeatChain[] {
  if (onsets.length < 4) return [];
  const ranked = scanTempoChains(onsets, settings);
  const selected: BeatChain[] = [];
  for (const chain of ranked) {
    const refined = refineCandidate(chain, onsets, settings);
    if (selected.every((existing) => Math.abs(existing.candidate.bpm - refined.candidate.bpm) > 3))
      selected.push(refined);
    if (selected.length === 8) break;
  }
  return selected.sort((left, right) => right.candidate.score - left.candidate.score);
}

function scanTempoChains(
  onsets: readonly OnsetEvent[],
  settings: RhythmSettings,
): readonly BeatChain[] {
  return Array.from(
    { length: Math.floor(settings.maximumBpm - settings.minimumBpm) + 1 },
    (_, index) => trackBeatChain(onsets, settings.minimumBpm + index),
  ).sort((left, right) => right.candidate.score - left.candidate.score);
}

function refineCandidate(
  chain: BeatChain,
  onsets: readonly OnsetEvent[],
  settings: RhythmSettings,
): BeatChain {
  const bpm = Math.min(settings.maximumBpm, Math.max(settings.minimumBpm, refineChainTempo(chain)));
  return trackBeatChain(onsets, bpm);
}

function rhythmConfidence(chains: readonly BeatChain[]): number {
  const best = chains[0]?.candidate;
  if (!best) return 0;
  const competitor =
    chains.find((chain) => Math.abs(chain.candidate.bpm / best.bpm - 1) > 0.06)?.candidate.score ??
    0;
  const margin = clampFeature((best.score - competitor) / 0.12);
  const octavePenalty = hasStrongOctaveAlternative(best, chains.slice(1)) ? 0.7 : 1;
  return quantizeFeature(best.score * (0.4 + margin * 0.6) * octavePenalty);
}

function hasStrongOctaveAlternative(
  best: TempoCandidate,
  alternatives: readonly BeatChain[],
): boolean {
  return alternatives.some((chain) => {
    const ratio = chain.candidate.bpm / best.bpm;
    return (
      Math.min(Math.abs(ratio - 0.5), Math.abs(ratio - 2)) < 0.03 &&
      chain.candidate.score > best.score * 0.8
    );
  });
}
