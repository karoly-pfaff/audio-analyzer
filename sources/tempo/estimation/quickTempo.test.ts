import { afterEach, expect, it, vi } from 'vitest';
import {
  estimateQuickTempo,
  DEFAULT_QUICK_TEMPO_SETTINGS,
  QUICK_TEMPO_SAMPLE_LIMIT,
} from '../../tempo.ts';
import * as estimator from './musicTempoEstimator.ts';

afterEach(() => vi.restoreAllMocks());

function pulseSamples(sampleRate: number): Float32Array {
  return Float32Array.from({ length: sampleRate * 6 }, (_, index) =>
    index % (sampleRate / 2) < sampleRate * 0.01 ? 0.8 : 0,
  );
}

it.each([44100, 48000, 96000])(
  'estimates 120 BPM on actual source PCM at %s Hz without claiming observed-beat confidence',
  (sampleRate) => {
    const samples = pulseSamples(sampleRate);
    const before = samples.slice();
    const result = estimateQuickTempo({ channels: [samples], sampleRate });
    expect(result.status).toBe('estimated');
    if (result.status !== 'estimated') throw new Error('Synthetic pulse train has no estimate.');
    expect(result.bpm).toBeCloseTo(120, 0);
    expect(result).toMatchObject({
      confidenceLabel: 'high',
      confidenceBasis: 'bpm-range-heuristic',
      sampleRate,
      analyzedFrameCount: samples.length,
      truncated: false,
    });
    expect(samples).toEqual(before);
  },
  15000,
);

it('reports silence, insufficient audio, and unavailable rhythm separately from failure', () => {
  expect(estimateQuickTempo({ channels: [new Float32Array(1)], sampleRate: 48000 })).toMatchObject({
    status: 'unavailable',
    reason: 'insufficient-audio',
  });
  expect(
    estimateQuickTempo({ channels: [new Float32Array(2048)], sampleRate: 48000 }),
  ).toMatchObject({ status: 'unavailable', reason: 'silence' });
  vi.spyOn(estimator, 'runMusicTempo').mockReturnValue({
    status: 'unavailable',
    reason: 'insufficient-rhythm',
  });
  expect(
    estimateQuickTempo({ channels: [new Float32Array(2048).fill(0.5)], sampleRate: 48000 }),
  ).toMatchObject({ status: 'unavailable', reason: 'insufficient-rhythm' });
  vi.spyOn(estimator, 'runMusicTempo').mockReturnValue({
    status: 'failed',
    code: 'estimator-failed',
  });
  expect(
    estimateQuickTempo({ channels: [new Float32Array(2048).fill(0.5)], sampleRate: 48000 }),
  ).toMatchObject({ status: 'failed', code: 'estimator-failed' });
});

it('checks cancellation before validation and before delivering synchronous results', () => {
  expect(estimateQuickTempo(null, {}, { aborted: true })).toMatchObject({ status: 'cancelled' });
  let reads = 0;
  const cancellation = {
    get aborted() {
      reads += 1;
      return reads > 1;
    },
  };
  expect(
    estimateQuickTempo(
      { channels: [new Float32Array(1)], sampleRate: 1 },
      DEFAULT_QUICK_TEMPO_SETTINGS,
      cancellation,
    ),
  ).toMatchObject({ status: 'cancelled' });
});

it('bounds analyzed samples at high rates and makes truncation and capped hops explicit', () => {
  const samples = new Float32Array(QUICK_TEMPO_SAMPLE_LIMIT + 1);
  const result = estimateQuickTempo({ channels: [samples], sampleRate: 768000 });
  expect(result).toMatchObject({
    status: 'unavailable',
    reason: 'silence',
    analyzedFrameCount: QUICK_TEMPO_SAMPLE_LIMIT,
    truncated: true,
    hopSize: 2048,
    timeStepSeconds: 2048 / 768000,
  });
  expect(
    estimateQuickTempo(
      { channels: [new Float32Array(2)], sampleRate: 1 },
      { ...DEFAULT_QUICK_TEMPO_SETTINGS, maximumSeconds: 0.01 },
    ),
  ).toMatchObject({ analyzedFrameCount: 1, hopSize: 1, truncated: true });
});

it('supports owned single-channel scratch and rejects invalid requests', () => {
  const input = { channels: [new Float32Array(2048)], sampleRate: 48000 };
  expect(estimateQuickTempo(input, { ...DEFAULT_QUICK_TEMPO_SETTINGS, channel: 0 })).toMatchObject({
    status: 'unavailable',
  });
  expect(() => estimateQuickTempo(null)).toThrow();
  expect(() => estimateQuickTempo(input, {})).toThrow();
});
