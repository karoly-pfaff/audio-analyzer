import { expect, it } from 'vitest';
import { measureSignalWindow } from './signalWindow.ts';

it('measures only the selected half-open sample window across all channels', () => {
  const result = measureSignalWindow(
    [new Float32Array([99, -2, 0]), new Float32Array([99, 0, 4])],
    { start: 1, end: 3 },
  );
  expect(result).toEqual({ minimum: -2, maximum: 4, rms: Math.sqrt(5) });
});

it('anchors one-sided waveforms at zero without modifying their measured RMS', () => {
  expect(measureSignalWindow([new Float32Array([0.5])], { start: 0, end: 1 })).toEqual({
    minimum: 0,
    maximum: 0.5,
    rms: 0.5,
  });
});
