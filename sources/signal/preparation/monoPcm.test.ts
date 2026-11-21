import { expect, it } from 'vitest';
import { parseSignalPcm } from '../contracts/signalPcm.ts';
import { prepareMonoPcm, signalValueAt } from './monoPcm.ts';

it('averages original channels in owned bounded storage without changing input', () => {
  const channels = [new Float32Array([2, -4, 0]), new Float32Array([-2, 2, 1])];
  const result = prepareMonoPcm(parseSignalPcm({ channels, sampleRate: 48000 }), {
    channel: 'mean',
    frameCount: 2,
  });
  expect(result).toEqual(new Float32Array([0, -1]));
  result[0] = 42;
  expect(channels[0]?.[0]).toBe(2);
});

it('copies a selected channel and rejects unavailable channels', () => {
  const pcm = parseSignalPcm({ channels: [new Float32Array([1, 2])], sampleRate: 1 });
  const result = prepareMonoPcm(pcm, { channel: 0, frameCount: 1 });
  expect(result).toEqual(new Float32Array([1]));
  expect(result).not.toBe(pcm.channels[0]);
  expect(() => prepareMonoPcm(pcm, { channel: 1, frameCount: 1 })).toThrow(
    expect.objectContaining({ code: 'invalid-pcm' }),
  );
});

it('pads only outside source bounds and keeps a finite arithmetic mean at extreme amplitudes', () => {
  expect(signalValueAt(new Float32Array([0.5]), -1)).toBe(0);
  expect(signalValueAt(new Float32Array([0.5]), 0)).toBe(0.5);
  expect(signalValueAt(new Float32Array([0.5]), 1)).toBe(0);
  const pcm = parseSignalPcm({
    channels: [new Float32Array([3e38]), new Float32Array([3e38])],
    sampleRate: 1,
  });
  expect(prepareMonoPcm(pcm, { channel: 'mean', frameCount: 1 }).every(Number.isFinite)).toBe(true);
});
