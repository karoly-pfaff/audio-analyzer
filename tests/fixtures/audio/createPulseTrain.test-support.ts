import { ANALYSIS_SAMPLE_RATE } from '@karoly-pfaff/audio-analyzer';

export interface PulseTrainFixture {
  readonly samples: Float32Array;
  readonly onsets: readonly number[];
}

/** Original synthesized decaying kick-like pulses with known sample-addressed onsets. */
export function createPulseTrain(options: {
  readonly bpm: number;
  readonly seconds: number;
  readonly start?: number;
}): PulseTrainFixture {
  const onsets = Array.from(
    { length: Math.floor(((options.seconds - (options.start ?? 0.5)) * options.bpm) / 60) },
    (_, index) => (options.start ?? 0.5) + (index * 60) / options.bpm,
  );
  const samples = new Float32Array(Math.round(options.seconds * ANALYSIS_SAMPLE_RATE));
  const kick = createKickPulse();
  for (const onset of onsets) samples.set(kick, Math.round(onset * ANALYSIS_SAMPLE_RATE));
  return { samples, onsets };
}

function createKickPulse(): Float32Array {
  return Float32Array.from({ length: ANALYSIS_SAMPLE_RATE * 0.08 }, (_, offset) => {
    const elapsed = offset / ANALYSIS_SAMPLE_RATE;
    return 0.8 * Math.exp(-elapsed * 45) * Math.sin(2 * Math.PI * (100 * elapsed + 0.01));
  });
}
