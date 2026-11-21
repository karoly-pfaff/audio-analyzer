import { beforeAll, expect, it } from 'vitest';
import { audioFeatureTimelineSchema } from './audioFeatureTimeline.ts';
import type { AudioFeatureTimeline } from './audioFeatureTimeline.ts';
import { analyzeAudio } from '../analyzeAudio.ts';
import { createAnalysisInput } from '../../tests/fixtures/audio/createAnalysisInput.test-support.ts';
import { createPulseTrain } from '../../tests/fixtures/audio/createPulseTrain.test-support.ts';

let timeline: AudioFeatureTimeline;

beforeAll(() => {
  timeline = analyzeAudio(createAnalysisInput(createPulseTrain({ bpm: 120, seconds: 8 }).samples));
});

it.each([
  'audio-rules-1.0.0-meyda-5.6.3',
  'audio-rules-1.1.0-meyda-5.6.3',
  'audio-rules-1.2.0-meyda-5.6.3',
])('preserves pinned %s analysis without silently upgrading its evidence', (analyzerVersion) => {
  const stored = { ...timeline, analyzerVersion };
  expect(audioFeatureTimelineSchema.parse(stored)).toEqual(stored);
});

const TIMELINE_MUTATIONS: readonly {
  name: string;
  corruptTimeline: (changed: AudioFeatureTimeline) => void;
}[] = [
  {
    name: 'version',
    corruptTimeline: (changed) => {
      Reflect.set(changed, 'analyzerVersion', 'outdated');
    },
  },
  {
    name: 'channel-count',
    corruptTimeline: (changed) => {
      changed.channels.energy.pop();
    },
  },
  {
    name: 'event-order',
    corruptTimeline: (changed) => {
      changed.onsets.reverse();
    },
  },
  {
    name: 'event-source',
    corruptTimeline: (changed) => {
      Reflect.set(changed.onsets[0] ?? {}, 'id', 'onset-' + 'b'.repeat(12) + '-0');
    },
  },
  {
    name: 'coverage',
    corruptTimeline: (changed) => {
      Reflect.set(changed.sections[0] ?? {}, 'start', 0.1);
    },
  },
  {
    name: 'short-region',
    corruptTimeline: (changed) => {
      Reflect.set(changed.sections[0] ?? {}, 'end', 2);
    },
  },
  {
    name: 'false-confidence',
    corruptTimeline: (changed) => {
      Reflect.set(changed.rhythm, 'confidence', 0);
    },
  },
  {
    name: 'invented-beat',
    corruptTimeline: (changed) => {
      Reflect.set(changed.beats[0] ?? {}, 'time', 0.25);
    },
  },
  {
    name: 'waveform',
    corruptTimeline: (changed) => {
      changed.waveform.minimum.pop();
    },
  },
  {
    name: 'novelty-clock',
    corruptTimeline: (changed) => {
      Reflect.set(changed.novelty[0] ?? {}, 'time', 0.1);
    },
  },
];

it.each(TIMELINE_MUTATIONS)(
  'rejects semantically invalid $name content at persistence/provider boundaries',
  ({ corruptTimeline }) => {
    const changed = structuredClone(timeline);
    corruptTimeline(changed);
    expect(audioFeatureTimelineSchema.safeParse(changed).success).toBe(false);
  },
);

it('keeps a rounded final diagnostic frame inside a non-grid-aligned short input', () => {
  expect(() => analyzeAudio(createAnalysisInput(new Float32Array(22050 * 4 + 1)))).not.toThrow();
});
