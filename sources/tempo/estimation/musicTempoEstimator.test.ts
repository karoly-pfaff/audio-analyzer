import { beforeEach, expect, it, vi } from 'vitest';
import { runMusicTempo } from './musicTempoEstimator.ts';

const mocks = vi.hoisted(() => ({
  construct: vi.fn<(samples: Float32Array, settings: unknown) => { tempo: string }>(function () {
    return { tempo: '120.125' };
  }),
}));

vi.mock('music-tempo', () => ({
  default: function MusicTempoStub(samples: Float32Array, settings: unknown): unknown {
    return mocks.construct(samples, settings);
  },
}));

beforeEach(() => {
  mocks.construct.mockReset();
});

it('validates the upstream string estimate and supplies the actual source-clock step', () => {
  mocks.construct.mockImplementation(function () {
    return { tempo: '120.125' };
  });
  const samples = new Float32Array(2048);
  expect(runMusicTempo(samples, { sampleRate: 48000, hopSize: 480 })).toEqual({
    status: 'estimated',
    bpm: 120.125,
  });
  expect(mocks.construct).toHaveBeenCalledWith(samples, {
    bufferSize: 2048,
    hopSize: 480,
    timeStep: 0.01,
  });
});

it.each(['Fail to find peaks', 'Fail to find IOIs', 'Tempo extraction failed'])(
  'distinguishes expected lack of rhythm from a failed estimator: %s',
  (failure) => {
    mocks.construct.mockImplementation(function () {
      // Upstream 1.0.3 throws these exact string sentinels, so the boundary test must reproduce them.
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw failure;
    });
    expect(runMusicTempo(new Float32Array(2048), { sampleRate: 48000, hopSize: 480 })).toEqual({
      status: 'unavailable',
      reason: 'insufficient-rhythm',
    });
  },
);

it('reports an unexpected estimator exception without exposing backend text', () => {
  mocks.construct.mockImplementation(function () {
    throw new Error('private backend context');
  });
  expect(runMusicTempo(new Float32Array(2048), { sampleRate: 48000, hopSize: 480 })).toEqual({
    status: 'failed',
    code: 'estimator-failed',
  });
});

it.each(['0', 'NaN', 'Infinity', '0.01', '1001'])(
  'rejects an invalid, nonfinite or implausible backend tempo: %s',
  (tempo) => {
    mocks.construct.mockImplementation(function () {
      return { tempo };
    });
    expect(runMusicTempo(new Float32Array(2048), { sampleRate: 48000, hopSize: 480 })).toEqual({
      status: 'failed',
      code: 'invalid-estimate',
    });
  },
);
