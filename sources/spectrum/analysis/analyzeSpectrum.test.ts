import { expect, it } from 'vitest';
import { analyzeSpectrum, DEFAULT_SPECTRUM_SETTINGS } from '../../spectrum.ts';

it('returns a versioned frequency and source-clock contract for the Lab display', () => {
  const samples = new Float32Array(4800);
  const result = analyzeSpectrum({ channels: [samples], sampleRate: 48000 });
  expect(result).toMatchObject({
    schemaVersion: 1,
    analyzerVersion: 'spectrum-rules-1.0.0-fft2048',
    fftSize: 2048,
    hopSize: 1024,
    binsPerFrame: 256,
    sampleRate: 48000,
    sourceFrameCount: 4800,
    durationSeconds: 0.1,
    binHz: 23.4375,
    maximumFrequencyHz: 5976.5625,
    nyquistHz: 24000,
    magnitudeScale: 'global-selected-bin-relative-db-0-1',
    centroidCoverage: 'full-one-sided-spectrum',
  });
  expect(result.frames).toEqual(
    Array.from({ length: result.numFrames }, () => new Float32Array(result.binsPerFrame)),
  );
  expect(result.frameRanges[0]?.firstCenterSeconds).toBe(0);
  expect(result.frameRanges.at(-1)?.lastCenterSeconds).toBeCloseTo(4799 / 48000, 12);
});

it('allows full Nyquist coverage and selected-channel inspection without cancellation', () => {
  const left = Float32Array.from({ length: 4096 }, (_, index) =>
    Math.sin((2 * Math.PI * 10000 * index) / 48000),
  );
  const right = left.map((value) => -value);
  const input = { channels: [left, right], sampleRate: 48000 };
  expect(analyzeSpectrum(input).centroidHz).toBe(0);
  const selected = analyzeSpectrum(input, { ...DEFAULT_SPECTRUM_SETTINGS, channel: 1, bins: 1025 });
  expect(selected.maximumFrequencyHz).toBe(24000);
  expect(selected.frames[0]).toHaveLength(1025);
  expect(selected.centroidHz).toBeCloseTo(10000, -2);
  expect(right).toEqual(left.map((value) => -value));
});

it('rejects invalid PCM, settings and unavailable channel selections', () => {
  const input = { channels: [new Float32Array(1)], sampleRate: 48000 };
  expect(() => analyzeSpectrum(null)).toThrow();
  expect(() => analyzeSpectrum(input, {})).toThrow();
  expect(() => analyzeSpectrum(input, { ...DEFAULT_SPECTRUM_SETTINGS, channel: 1 })).toThrow();
});
