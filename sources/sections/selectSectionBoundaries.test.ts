import { expect, it } from 'vitest';
import { selectSectionBoundaries } from './selectSectionBoundaries.ts';
import { DEFAULT_SECTION_SETTINGS } from './sectionEvents.ts';

it('keeps the strongest nearby boundary and reserves a complete minimum-length tail', () => {
  const points = [0, 0.3, 0, 0.8, 0, 0, 0.6].map((novelty, index) => ({
    frame: index * 400,
    time: [0, 8, 9, 12, 13, 25, 30][index] ?? 0,
    novelty,
    energyDelta: 0,
    trendDelta: 0,
  }));
  const result = selectSectionBoundaries(points, 32, DEFAULT_SECTION_SETTINGS);
  expect(result.map((point) => point.time)).toEqual([12]);
});

it('returns several legal boundaries in source order even when a later peak is stronger', () => {
  const points = [0, 10, 11, 30, 31, 50, 51].map((time, index) => ({
    frame: index * 100,
    time,
    novelty: [0, 0.3, 0, 0.9, 0, 0.5, 0][index] ?? 0,
    energyDelta: 0,
    trendDelta: 0,
  }));
  expect(
    selectSectionBoundaries(points, 65, DEFAULT_SECTION_SETTINGS).map((point) => point.time),
  ).toEqual([10, 30, 50]);
});
