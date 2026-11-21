import { expect, it } from 'vitest';
import { trackBeatChain, refineChainTempo } from './trackBeatChain.ts';

it('penalizes timing residuals even when a loose chain covers the same observed onsets', () => {
  const onsets = Array.from({ length: 20 }, (_, index) => ({
    id: 'onset-' + 'a'.repeat(12) + '-' + String(index),
    time: 0.5 + index * 0.5,
    strength: 1,
    confidence: 1,
  }));
  const precise = trackBeatChain(onsets, 120);
  const loose = trackBeatChain(onsets, 110);
  expect(precise.onsets).toHaveLength(onsets.length);
  expect(loose.onsets).toHaveLength(onsets.length);
  expect(precise.candidate.score - loose.candidate.score).toBeGreaterThan(0.15);
  expect(precise.candidate.timing).toBe(1);
  expect(loose.candidate.timing).toBeLessThan(0.5);
});

it('keeps an empty or zero-strength observation set unconfident without inventing beats', () => {
  const empty = trackBeatChain([], 120);
  expect(empty.onsets).toEqual([]);
  expect(empty.candidate.score).toBe(0);
  expect(refineChainTempo(empty)).toBe(120);
  expect(
    trackBeatChain([{ id: 'onset-aaaaaaaaaaaa-0', time: 0, strength: 0, confidence: 0 }], 120)
      .onsets,
  ).toEqual([]);
});
