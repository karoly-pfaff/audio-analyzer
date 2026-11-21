import { expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { analyzeAudio } from './analyzeAudio.ts';
import { audioFeatureTimelineSchema } from './contracts/audioFeatureTimeline.ts';
import { createAnalysisInput } from '../tests/fixtures/audio/createAnalysisInput.test-support.ts';
import { createPulseTrain } from '../tests/fixtures/audio/createPulseTrain.test-support.ts';
import { createAnalysisPcm } from './contracts/analysisPcm.ts';

it('produces a reproducible, versioned complete timeline with normalized channels and waveform', () => {
  const fixture = createPulseTrain({ bpm: 120, seconds: 8 });
  const input = createAnalysisInput(fixture.samples);
  const timeline = analyzeAudio(input);
  expect(audioFeatureTimelineSchema.safeParse(timeline).success).toBe(true);
  expect(timeline.beats).toHaveLength(fixture.onsets.length);
  expect(timeline.waveform.minimum).toHaveLength(Math.ceil(fixture.samples.length / 1024));
  expect(timeline.channels.beatPhase?.some((phase) => phase !== null && phase > 0.5)).toBe(true);
  expect(analyzeAudio(input)).toEqual(timeline);
});

it('keeps silence as a valid zero-confidence timeline with no invented rhythmic phase', () => {
  const timeline = analyzeAudio(createAnalysisInput());
  expect(timeline.onsets).toEqual([]);
  expect(timeline.beats).toEqual([]);
  expect(timeline.channels.beatPhase).toBeNull();
  expect(timeline.sections).toMatchObject([{ start: 0, end: 1, confidence: 0 }]);
});

// E11's original synthetic corpus pins numeric/cache compatibility before any FFT/backend change.
it.each([
  {
    name: 'silence',
    createSamples: () => new Float32Array(22050 * 30),
    sha256: '0362f987da1b000afa1cea8ff72dafc6774cfbb29779da0ad3ed160ef247e792',
  },
  {
    name: '174 BPM pulses',
    createSamples: () => createPulseTrain({ bpm: 174, seconds: 30 }).samples,
    sha256: '007c7a4d7d000bd6a5df160570723e3796980e712cbb013da59847fa34b90351',
  },
  {
    name: 'mixed spectrum',
    createSamples: () =>
      Float32Array.from(
        { length: 22050 * 30 },
        (_, index) =>
          0.15 * Math.sin(index * 0.02) +
          0.12 * Math.sin(index * 0.17) +
          0.1 * Math.sin(index * 1.4),
      ),
    sha256: '20aaa72aea48098ed33adefd3f9e9baccbb0c176d2a2d55cde07cfd5f0b35b4b',
  },
])(
  'retains the agreed $name timeline and source PCM exactly',
  (fixture) => {
    const pcm = createAnalysisPcm(fixture.createSamples());
    const before = createHash('sha256').update(pcm.samples).digest('hex');
    const timeline = analyzeAudio({
      pcm,
      sourceSha256: 'a'.repeat(64),
      provenance: {
        pcmSha256: 'b'.repeat(64),
        decoderVersion: 'original E11 synthetic fixtures v1',
      },
    });
    expect(timeline.analyzerVersion).toBe('audio-rules-1.3.0-meyda-5.6.3');
    expect(createHash('sha256').update(JSON.stringify(timeline)).digest('hex')).toBe(
      fixture.sha256,
    );
    expect(createHash('sha256').update(pcm.samples).digest('hex')).toBe(before);
  },
  30_000,
);
