import { expect, it } from 'vitest';
import { SignalRegionCollector } from './SignalRegionCollector.ts';

it('coalesces adjacent windows and reports exact trailing duration', () => {
  const collector = new SignalRegionCollector({ sampleRate: 1000, maximumRegions: 200 });
  collector.observe(true, 0);
  collector.observe(true, 50);
  collector.observe(false, 100);
  collector.observe(false, 150);
  collector.observe(true, 200);
  expect(collector.finish(275)).toEqual({
    regions: [
      { startSeconds: 0, endSeconds: 0.1 },
      { startSeconds: 0.2, endSeconds: 0.275 },
    ],
    regionCount: 2,
    regionsTruncated: false,
    longestRegionSeconds: 0.1,
  });
});

it('keeps full counts and longest duration when the region output budget is exhausted', () => {
  const collector = new SignalRegionCollector({ sampleRate: 1000, maximumRegions: 1 });
  collector.observe(true, 0);
  collector.observe(false, 50);
  collector.observe(true, 100);
  expect(collector.finish(300)).toEqual({
    regions: [{ startSeconds: 0, endSeconds: 0.05 }],
    regionCount: 2,
    regionsTruncated: true,
    longestRegionSeconds: 0.2,
  });
});

it('returns an honest empty result when no window qualifies', () => {
  const collector = new SignalRegionCollector({ sampleRate: 1000, maximumRegions: 1 });
  collector.observe(false, 0);
  expect(collector.finish(1)).toEqual({
    regions: [],
    regionCount: 0,
    regionsTruncated: false,
    longestRegionSeconds: 0,
  });
});
