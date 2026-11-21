import { analyzeAudio, audioFeatureTimelineSchema } from '@karoly-pfaff/audio-analyzer';
import type { AudioFeatureTimeline } from '@karoly-pfaff/audio-analyzer';
import { createAnalysisInput } from './createAnalysisInput.test-support.ts';

/** Synthetic director evidence; actual audio crosses packages in integration tests. */
export function createDirectorTimelineFixture(durationSeconds = 40): AudioFeatureTimeline {
  const template = analyzeAudio(createAnalysisInput(new Float32Array(1)));
  const sampleCount = Math.round(22050 * durationSeconds);
  const frameCount = Math.ceil(sampleCount / template.hopSize);
  const peakCount = Math.ceil(sampleCount / template.waveform.samplesPerPeak);
  const duration = sampleCount / template.sampleRate;
  return audioFeatureTimelineSchema.parse({
    ...template,
    sampleCount,
    durationSeconds: duration,
    raw: createZeroChannels(template.raw, frameCount),
    channels: createZeroChannels(template.channels, frameCount),
    sections: [{ ...template.sections[0], end: duration }],
    waveform: {
      ...template.waveform,
      minimum: Array.from({ length: peakCount }, () => 0),
      maximum: Array.from({ length: peakCount }, () => 0),
    },
    novelty: Array.from({ length: Math.ceil(duration * 2) }, (_, index) => {
      const frame = Math.min(frameCount - 1, Math.round((index * template.featureHz) / 2));
      return { frame, time: frame / template.featureHz, novelty: 0, energyDelta: 0, trendDelta: 0 };
    }),
  });
}

function createZeroChannels(
  channels: Record<string, readonly (number | null)[] | null>,
  frameCount: number,
) {
  return Object.fromEntries(
    Object.entries(channels).map(([channel, values]) => [
      channel,
      values === null ? null : Array.from({ length: frameCount }, () => 0),
    ]),
  );
}
