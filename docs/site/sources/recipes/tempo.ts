import { estimateQuickTempo, getBpmRelation } from '@karoly-pfaff/audio-analyzer/tempo';
import type { QuickTempoResult, TempoCancellation } from '@karoly-pfaff/audio-analyzer/tempo';

export function estimateTempo(input: unknown, cancellation?: TempoCancellation): QuickTempoResult {
  // Handle all statuses before reading bpm. This flag cannot interrupt synchronous DSP.
  return estimateQuickTempo(input, { channel: 'mean', maximumSeconds: 12 }, cancellation);
}

export function compareTempos(): ReturnType<typeof getBpmRelation> {
  return getBpmRelation(60, 119.9); // 'halfDouble'
}
