import { expect, it } from 'vitest';
import { createTransientActivity } from './transientActivity.ts';

it('normalizes positive display-energy rises without inventing onset timestamps', () => {
  expect(createTransientActivity(new Float32Array([0.25, 0.5, 1, 0.5, 0.75]))).toEqual(
    new Float32Array([0, 0.5, 1, 0, 0.5]),
  );
});

it.each([[], [0], [0, 0], [1, 1, 0.5]].map((values) => ({ values })))(
  'keeps flat or falling energy quiet: %j',
  ({ values }) => {
    expect(createTransientActivity(Float32Array.from(values))).toEqual(
      new Float32Array(values.length),
    );
  },
);
