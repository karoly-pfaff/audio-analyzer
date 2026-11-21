import { expect, it } from 'vitest';
import { createAnalysisPcm } from '../../contracts/analysisPcm.ts';
import { extractFrameFeatures } from './extractFrameFeatures.ts';
import { smoothFrameChannels } from './smoothFrameChannels.ts';
import { detectOnsets } from '../../rhythm/onsets/detectOnsets.ts';
import { createPulseTrain } from '../../../tests/fixtures/audio/createPulseTrain.test-support.ts';

it('keeps raw frames unchanged while producing bounded reproducible envelopes with the same clock', () => {
  const fixture = createPulseTrain({ bpm: 120, seconds: 2 });
  const frames = extractFrameFeatures(createAnalysisPcm(fixture.samples), 'a'.repeat(64));
  const before = JSON.stringify(frames);
  const events = detectOnsets(frames);
  const channels = smoothFrameChannels(frames, events);
  expect(JSON.stringify(frames)).toBe(before);
  expect(Object.values(channels).every((values) => values.length === frames.raw.rms.length)).toBe(
    true,
  );
  expect(channels.energy.every((value) => Number.isFinite(value) && value >= 0 && value <= 1)).toBe(
    true,
  );
  expect(smoothFrameChannels(frames, events)).toEqual(channels);
});
