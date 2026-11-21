import type { RhythmSettings } from '../beats/rhythmEvents.ts';
import { trackBeatChain } from '../beats/trackBeatChain.ts';
import { correlateTempo } from '../periodicity/tempoCorrelation.ts';
import type { CorrelatedTempo } from '../periodicity/tempoCorrelation.ts';
import type { RhythmWindow } from './rhythmWindows.ts';

export function selectRegionalTempo(
  window: RhythmWindow,
  options: { readonly referenceBpm: number; readonly settings: RhythmSettings },
): CorrelatedTempo | null {
  const candidates = correlateTempo(window.frames, options.settings).filter(
    (tempo) => tempo.correlation >= 0.5,
  );
  let best: { tempo: CorrelatedTempo | null; fitness: number } = { tempo: null, fitness: 0 };
  for (const tempo of candidates) {
    const fitness = regionalTempoFitness(window, tempo, options.referenceBpm);
    if (fitness > best.fitness) best = { tempo, fitness };
  }
  return best.tempo;
}

function regionalTempoFitness(
  window: RhythmWindow,
  tempo: CorrelatedTempo,
  referenceBpm: number,
): number {
  const chain = trackBeatChain(window.onsets, tempo.bpm);
  const fitness = Math.sqrt(chain.candidate.continuity * chain.candidate.timing);
  // Prefer a consistent metrical level without forbidding a real local tempo change.
  const preference = 0.5 + 0.5 * Math.exp(-0.5 * (Math.log(tempo.bpm / referenceBpm) / 0.2) ** 2);
  return tempo.correlation * fitness * preference;
}
