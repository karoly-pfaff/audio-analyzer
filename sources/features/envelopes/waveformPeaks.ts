import { z } from 'zod';
import type { AnalysisPcm } from '../../contracts/analysisPcm.ts';
import { quantizeFeature } from '../statistics/featureStatistics.ts';

export const waveformPeaksSchema = z.strictObject({
  samplesPerPeak: z.literal(1024),
  minimum: z.array(z.number().min(-1).max(1)).max(38760),
  maximum: z.array(z.number().min(-1).max(1)).max(38760),
});

export type WaveformPeaks = z.infer<typeof waveformPeaksSchema>;

export function createWaveformPeaks(pcm: AnalysisPcm): WaveformPeaks {
  const peaks = Array.from({ length: Math.ceil(pcm.samples.length / 1024) }, (_, index) =>
    windowPeaks(pcm.samples.subarray(index * 1024, (index + 1) * 1024)),
  );
  return waveformPeaksSchema.parse({
    samplesPerPeak: 1024,
    minimum: peaks.map((peak) => peak.minimum),
    maximum: peaks.map((peak) => peak.maximum),
  });
}

function windowPeaks(samples: Float32Array) {
  return {
    minimum: quantizeFeature(
      samples.reduce((minimum, value) => Math.min(minimum, value), Infinity),
    ),
    maximum: quantizeFeature(
      samples.reduce((maximum, value) => Math.max(maximum, value), -Infinity),
    ),
  };
}
