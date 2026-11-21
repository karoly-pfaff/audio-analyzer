import type { TempoConfidenceLabel } from '../contracts/tempoResult.ts';

/** Legacy Lab label based on BPM range only; never an observed-beat probability. */
export function tempoConfidenceLabel(bpm: number): TempoConfidenceLabel {
  if (bpm >= 60 && bpm <= 160) return 'high';
  if (bpm >= 40 && bpm <= 220) return 'medium';
  return 'low';
}
