import { expect, it } from 'vitest';
import { createAnalysisPcm } from '../../contracts/analysisPcm.ts';
import { createWaveformPeaks } from './waveformPeaks.ts';

it('retains both polarities and the final partial waveform window', () => {
  const samples = new Float32Array(1025);
  samples.set([-0.5, 0.75]);
  samples.set([-0.25], 1024);
  expect(createWaveformPeaks(createAnalysisPcm(samples))).toEqual({
    samplesPerPeak: 1024,
    minimum: [-0.5, -0.25],
    maximum: [0.75, -0.25],
  });
});
