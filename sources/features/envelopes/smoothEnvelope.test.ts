import { expect, it } from 'vitest';
import { smoothEnvelope } from './smoothEnvelope.ts';

it('matches analytic attack/release time constants on the source feature clock', () => {
  const risen = smoothEnvelope(
    Array.from({ length: 10 }, () => 1),
    { featureHz: 100, attackMs: 100, releaseMs: 200 },
  );
  expect(risen[9]).toBeCloseTo(1 - Math.exp(-1), 8);
  const pulse = smoothEnvelope([1, ...Array.from<number>({ length: 20 }).fill(0)], {
    featureHz: 100,
    attackMs: 0,
    releaseMs: 200,
  });
  expect(pulse[20]).toBeCloseTo(Math.exp(-1), 8);
});

it('does not mutate input or accumulate a playback delta', () => {
  const values = [0, 1, 0.5, 0];
  const settings = { featureHz: 80, attackMs: 20, releaseMs: 150 };
  expect(smoothEnvelope(values, settings)).toEqual(smoothEnvelope(values, settings));
  expect(values).toEqual([0, 1, 0.5, 0]);
});

it.each([NaN, Infinity, -1, 2])('rejects invalid normalized targets %s', (target) => {
  expect(() => smoothEnvelope([target], { featureHz: 80, attackMs: 0, releaseMs: 0 })).toThrow();
});
