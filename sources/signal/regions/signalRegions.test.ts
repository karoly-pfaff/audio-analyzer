import { expect, it } from 'vitest';
import { findSignalRegions } from './signalRegions.ts';
import { parseSignalPcm } from '../contracts/signalPcm.ts';

it('includes a clipped tail after the last complete ten-millisecond window', () => {
  const samples = new Float32Array(485);
  samples[484] = -1;
  const pcm = parseSignalPcm({ channels: [samples], sampleRate: 48_000 });
  expect(
    findSignalRegions(pcm, {
      kind: 'clipping',
      threshold: 0.999,
      windowSeconds: 0.01,
      maximumRegions: 200,
    }).regions,
  ).toEqual([{ startSeconds: 0.01, endSeconds: 485 / 48_000 }]);
});

it('counts silence only while every channel is quiet, including channels beyond stereo', () => {
  const pcm = parseSignalPcm({
    channels: [new Float32Array(3), new Float32Array(3), new Float32Array([0, 0.5, 0])],
    sampleRate: 1,
  });
  expect(
    findSignalRegions(pcm, {
      kind: 'silence',
      threshold: 0.0001,
      windowSeconds: 0.05,
      maximumRegions: 200,
    }).regions,
  ).toEqual([
    { startSeconds: 0, endSeconds: 1 },
    { startSeconds: 2, endSeconds: 3 },
  ]);
});
