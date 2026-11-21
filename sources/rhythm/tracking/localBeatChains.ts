import type { OnsetEvent } from '../onsets/onsetEvents.ts';
import type { BeatEvent, RhythmSettings } from '../beats/rhythmEvents.ts';
import { trackBeatChain, refineChainTempo } from '../beats/trackBeatChain.ts';
import type { BeatChain } from '../beats/trackBeatChain.ts';
import { observedBeatConfidence } from '../beats/observedBeatConfidence.ts';
import type { CorrelatedTempo } from '../periodicity/tempoCorrelation.ts';
import { requireFeatureEntry } from '../../features/statistics/featureStatistics.ts';
import { selectRegionalTempo } from './regionalTempo.ts';
import type { RhythmWindow } from './rhythmWindows.ts';

interface ChainEvidence {
  readonly tempo: CorrelatedTempo;
  readonly settings: RhythmSettings;
}

interface ChainSearch {
  readonly pending: (readonly OnsetEvent[])[];
  readonly beats: BeatEvent[];
}

export function observeWindowBeats(
  window: RhythmWindow,
  options: { readonly referenceBpm: number; readonly settings: RhythmSettings },
): readonly BeatEvent[] {
  const tempo = selectRegionalTempo(window, options);
  if (!tempo) return [];
  const search: ChainSearch = { pending: [window.onsets], beats: [] };
  while (search.pending.length > 0)
    visitObservedChain(search, { tempo, settings: options.settings });
  return search.beats.filter((beat) => beat.time >= window.start && beat.time < window.end);
}

function visitObservedChain(search: ChainSearch, evidence: ChainEvidence): void {
  const observations = requireFeatureEntry(search.pending.pop());
  const chain = trackBeatChain(observations, evidence.tempo.bpm);
  if (chain.onsets.length < 8) return;
  search.beats.push(...refinedChainBeats(observations, { chain, evidence }));
  search.pending.push(...outsideObservedChain(observations, chain));
}

function refinedChainBeats(
  observations: readonly OnsetEvent[],
  context: { readonly chain: BeatChain; readonly evidence: ChainEvidence },
): readonly BeatEvent[] {
  const bpm = refineChainTempo(context.chain);
  const settings = context.evidence.settings;
  if (bpm < settings.minimumBpm || bpm > settings.maximumBpm) return [];
  const chain = trackBeatChain(observations, bpm);
  return confidentChainBeats(chain, context.evidence);
}

function confidentChainBeats(chain: BeatChain, evidence: ChainEvidence): readonly BeatEvent[] {
  const confidence = Math.sqrt(evidence.tempo.correlation * chain.candidate.timing);
  if (!hasChainSupport(chain) || confidence < evidence.settings.minimumConfidence) return [];
  return chain.onsets.map((onset, index) => ({
    id: onset.id.replace('onset-', 'beat-'),
    time: onset.time,
    confidence: observedBeatConfidence(chain.onsets, index, {
      bpm: chain.candidate.bpm,
      confidence,
    }),
  }));
}

function hasChainSupport(chain: BeatChain): boolean {
  if (chain.onsets.length < 8) return false;
  const extent =
    requireFeatureEntry(chain.onsets.at(-1)).time - requireFeatureEntry(chain.onsets[0]).time;
  return extent >= 2 && chain.candidate.continuity >= 0.5;
}

function outsideObservedChain(onsets: readonly OnsetEvent[], chain: BeatChain) {
  const first = requireFeatureEntry(chain.onsets[0]).time;
  const last = requireFeatureEntry(chain.onsets.at(-1)).time;
  return [
    onsets.filter((onset) => onset.time < first),
    onsets.filter((onset) => onset.time > last),
  ].filter((range) => range.length >= 8);
}
