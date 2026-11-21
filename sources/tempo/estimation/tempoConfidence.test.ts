import { expect, it } from 'vitest';
import { tempoConfidenceLabel } from './tempoConfidence.ts';

it.each([
  [60, 'high'],
  [160, 'high'],
  [40, 'medium'],
  [59, 'medium'],
  [161, 'medium'],
  [220, 'medium'],
  [39, 'low'],
  [221, 'low'],
] as const)('retains the explicitly heuristic BPM range label for %s', (bpm, label) => {
  expect(tempoConfidenceLabel(bpm)).toBe(label);
});
