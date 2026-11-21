import { expect, it } from 'vitest';
import { createSignalEnvelope } from '../../signal.ts';

it('preserves partial tails, overlaps and original amplitudes across all channels', () => {
  const result = createSignalEnvelope(
    { channels: [new Float32Array([0.25, -0.5, 0.5, 2, -4])], sampleRate: 48_000 },
    2,
  );
  expect(result.minimum).toEqual(new Float32Array([-0.5, -4]));
  expect(result.maximum).toEqual(new Float32Array([0.5, 2]));
  expect(result.rms[0]).toBeCloseTo(Math.sqrt(0.5625 / 3), 6);
  expect(result.rms[1]).toBeCloseTo(Math.sqrt(20.25 / 3), 6);
  expect(result).toMatchObject({
    frameCount: 5,
    sampleRate: 48_000,
    durationSeconds: 5 / 48_000,
    channelCount: 1,
    channelPolicy: 'all-channel-extrema-and-rms',
  });
});

it('keeps right-only and anti-phase stereo visible without mono cancellation', () => {
  const input = {
    channels: [new Float32Array([0, 0, 0.5, 0]), new Float32Array([0, 0, -0.5, 0])],
    sampleRate: 48_000,
  };
  const result = createSignalEnvelope(input, 4);
  expect(result.minimum[2]).toBe(-0.5);
  expect(result.maximum[2]).toBe(0.5);
  expect(result.rms[2]).toBe(0.5);
  result.maximum[2] = 0;
  expect(input.channels[0]?.[2]).toBe(0.5);
  const rightOnly = createSignalEnvelope(
    { ...input, channels: [new Float32Array(4), input.channels[1]] },
    4,
  );
  expect(rightOnly.minimum[2]).toBe(-0.5);
});

it('includes channels beyond stereo and repeats source samples at higher display resolution', () => {
  const result = createSignalEnvelope(
    {
      channels: [new Float32Array(1), new Float32Array(1), new Float32Array([-0.5])],
      sampleRate: 96_000,
    },
    3,
  );
  expect(result.minimum).toEqual(new Float32Array([-0.5, -0.5, -0.5]));
  expect(result.maximum).toEqual(new Float32Array(3));
});

it('defaults to a bounded resolution and returns aligned quiet envelopes', () => {
  const input = { channels: [new Float32Array(2)], sampleRate: 48_000 };
  expect(createSignalEnvelope(input).minimum).toHaveLength(1024);
  expect(createSignalEnvelope(input, 1).transientActivity).toEqual(new Float32Array(1));
});

it.each([0, -1, 1.5, 65_537, Infinity, NaN])(
  'rejects invalid display resolution %s before allocation',
  (columns) => {
    expect(() =>
      createSignalEnvelope({ channels: [new Float32Array(1)], sampleRate: 1 }, columns),
    ).toThrow(expect.objectContaining({ code: 'invalid-resolution' }));
  },
);
