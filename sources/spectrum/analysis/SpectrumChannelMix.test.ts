import { expect, it } from 'vitest';
import { parseSignalPcm } from '../../signal/contracts/signalPcm.ts';
import { prepareSpectrumSamples } from './SpectrumChannelMix.ts';

it('preserves the original float intermediate sums before division across three channels', () => {
  const channels = [
    new Float32Array([1, -1, 0]),
    new Float32Array([0.00000007, 0, 0.5]),
    new Float32Array([-1, 1, -0.5]),
  ];
  const pcm = parseSignalPcm({ channels, sampleRate: 48000 });
  const mixed = prepareSpectrumSamples(pcm, 'mean');
  expect(mixed).toEqual(
    new Float32Array([Math.fround(1 + Math.fround(0.00000007)) - 1, 0, 0]).map(
      (value) => value / 3,
    ),
  );
  expect(channels[0]).toEqual(new Float32Array([1, -1, 0]));
});

it('owns mono and selected-channel scratch without changing original PCM', () => {
  const pcm = parseSignalPcm({ channels: [new Float32Array([2, -4])], sampleRate: 48000 });
  expect(prepareSpectrumSamples(pcm, 'mean')).toEqual(pcm.channels[0]);
  expect(prepareSpectrumSamples(pcm, 0)).not.toBe(pcm.channels[0]);
});
