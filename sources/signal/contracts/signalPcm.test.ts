import { expect, it } from 'vitest';
import { parseSignalPcm, SIGNAL_PCM_LIMITS } from './signalPcm.ts';
import { SignalAnalysisError } from './SignalAnalysisError.ts';

it('derives the source clock without downmixing, resampling, normalizing or copying channels', () => {
  const samples = new Float32Array([2, -4, 0]);
  const pcm = parseSignalPcm({ channels: [samples], sampleRate: 48_000 });
  expect(pcm.channels[0]).toBe(samples);
  expect(pcm).toMatchObject({ sampleRate: 48_000, frameCount: 3, durationSeconds: 3 / 48_000 });
  expect(samples).toEqual(new Float32Array([2, -4, 0]));
});

it.each([
  null,
  {},
  { channels: [], sampleRate: 48_000 },
  { channels: [[0]], sampleRate: 48_000 },
  { channels: [new Float64Array(1)], sampleRate: 48_000 },
  { channels: [new Float32Array()], sampleRate: 48_000 },
  { channels: [new Float32Array(2), new Float32Array(1)], sampleRate: 48_000 },
  { channels: [new Float32Array([NaN])], sampleRate: 48_000 },
  { channels: [new Float32Array([Infinity])], sampleRate: 48_000 },
  { channels: [new Float32Array(1)], sampleRate: 0 },
  { channels: [new Float32Array(1)], sampleRate: -1 },
  { channels: [new Float32Array(1)], sampleRate: 0.5 },
  { channels: [new Float32Array(1)], sampleRate: NaN },
  { channels: [new Float32Array(1)], sampleRate: Infinity },
  { channels: [new Float32Array(1)], sampleRate: 768_001 },
  { channels: [new Float32Array(1)], sampleRate: 1, durationSeconds: 42 },
])('rejects malformed or inconsistent original PCM: %j', (input) => {
  expect(() => parseSignalPcm(input)).toThrow(SignalAnalysisError);
  expect(() => parseSignalPcm(input)).toThrow(expect.objectContaining({ code: 'invalid-pcm' }));
});

it('bounds channel count and decoded sample values before scanning oversized input', () => {
  const channels = Array.from({ length: SIGNAL_PCM_LIMITS.channels }, () => new Float32Array(1));
  expect(parseSignalPcm({ channels, sampleRate: 768_000 }).channels).toHaveLength(32);
  expect(() => parseSignalPcm({ channels: [...channels, channels[0]], sampleRate: 1 })).toThrow();
  const oversized = new Float32Array(1);
  // Model oversized input metadata without allocating hundreds of megabytes for a guard test.
  Object.defineProperty(oversized, 'length', { value: SIGNAL_PCM_LIMITS.sampleValues + 1 });
  expect(() => parseSignalPcm({ channels: [oversized], sampleRate: 1 })).toThrow();
});

it('does not impose the musical profile thirty-minute limit on original PCM', () => {
  const pcm = parseSignalPcm({ channels: [new Float32Array(3601)], sampleRate: 1 });
  expect(pcm.durationSeconds).toBe(3601);
});
