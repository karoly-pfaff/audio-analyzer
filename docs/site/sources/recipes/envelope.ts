import { createSignalEnvelope } from '@karoly-pfaff/audio-analyzer/signal';
import type { SignalEnvelope } from '@karoly-pfaff/audio-analyzer/signal';

export function prepareWaveform(input: unknown): SignalEnvelope {
  // Size to display needs. This is original amplitude, not normalized musical energy.
  return createSignalEnvelope(input, 128);
}
