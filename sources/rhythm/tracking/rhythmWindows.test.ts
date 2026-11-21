import { expect, it } from 'vitest';
import { createRhythmWindows } from './rhythmWindows.ts';
import { createDenseBeatEvidence } from '../../../tests/fixtures/audio/createDenseBeatEvidence.test-support.ts';

it('partitions the whole recording with bounded contextual evidence and absolute onset times', () => {
  const { frames, onsets } = createDenseBeatEvidence();
  const windows = createRhythmWindows({ ...frames, durationSeconds: 19 }, onsets);
  expect(windows.map(({ start, end }) => [start, end])).toEqual([
    [0, 8],
    [8, 16],
    [16, 19],
  ]);
  expect(windows[0]?.frames.raw.flux).toEqual(
    frames.raw.flux.slice(0, Math.ceil(12 * frames.featureHz)),
  );
  expect(windows[1]?.frames.raw.flux).toEqual(
    frames.raw.flux.slice(Math.floor(4 * frames.featureHz), Math.ceil(19 * frames.featureHz)),
  );
  expect(windows[2]?.onsets).toEqual(onsets.filter((onset) => onset.time >= 12 && onset.time < 19));
  expect(createRhythmWindows({ ...frames, durationSeconds: 0 }, [])).toEqual([]);
});
