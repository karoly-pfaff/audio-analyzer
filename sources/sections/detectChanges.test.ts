import { expect, it } from 'vitest';
import { detectChanges } from './detectChanges.ts';

it('does not repeat a sustained change and does not replace a stronger nearby observation', () => {
  const points = [
    { frame: 0, time: 0, novelty: 0.8, energyDelta: 0.5, trendDelta: 0 },
    { frame: 10, time: 1, novelty: 0.4, energyDelta: 0.3, trendDelta: 0 },
    { frame: 90, time: 9, novelty: 0.6, energyDelta: 0.4, trendDelta: 0 },
  ];
  const events = detectChanges(points, 'a'.repeat(64));
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({ time: 0, kind: 'drop', confidence: 0.8 });
});
