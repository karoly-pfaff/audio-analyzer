import { expect, it } from 'vitest';
import { createAnalysisPcm } from '../contracts/analysisPcm.ts';
import { extractFrameFeatures } from '../features/spectrum/extractFrameFeatures.ts';
import { analyzeSections } from './analyzeSections.ts';
import { sectionEventSchema, changeEventSchema } from './sectionEvents.ts';
import { createTone } from '../../tests/fixtures/audio/createTone.test-support.ts';
import { FEATURE_HZ } from '../contracts/frameFeatures.ts';

function changingTone(seconds: number, amplitude: (time: number) => number) {
  return Float32Array.from(
    { length: Math.round(seconds * 22050) },
    (_, index) => amplitude(index / 22050) * Math.sin((2 * Math.PI * index * 440) / 22050),
  );
}

it('finds an abrupt loudness transition within one second and covers the complete track', () => {
  const samples = changingTone(24, (time) => (time < 12 ? 0.03 : 0.6));
  const frames = extractFrameFeatures(createAnalysisPcm(samples), 'a'.repeat(64));
  const result = analyzeSections(frames);
  expect(result.sections).toHaveLength(2);
  expect(Math.abs((result.sections[1]?.start ?? -10) - 12)).toBeLessThan(1);
  expect(result.sections[0]?.start).toBe(0);
  expect(result.sections.at(-1)?.end).toBe(24);
  expect(result.sections.every((section) => section.end - section.start >= 8)).toBe(true);
  expect(
    result.changes.some((change) => change.kind === 'drop' && Math.abs(change.time - 12) < 1),
  ).toBe(true);
  expect(result.sections.every((section) => sectionEventSchema.safeParse(section).success)).toBe(
    true,
  );
  expect(result.changes.every((change) => changeEventSchema.safeParse(change).success)).toBe(true);
  expect(result.sectionEnergy).toHaveLength(Math.ceil(24 * FEATURE_HZ));
  expect(analyzeSections(frames)).toEqual(result);
});

it('keeps short audio as one region and does not invent confidence for silence', () => {
  const frames = extractFrameFeatures(
    createAnalysisPcm(new Float32Array(22050 * 3)),
    'a'.repeat(64),
  );
  const result = analyzeSections(frames);
  expect(result.sections).toHaveLength(1);
  expect(result.sections[0]).toMatchObject({ start: 0, end: 3, energy: 0, confidence: 0 });
  expect(result.changes).toEqual([]);
});

it('detects a gradual build without treating every sample as a new change', () => {
  const samples = changingTone(30, (time) => 0.02 + (time / 30) * 0.6);
  const frames = extractFrameFeatures(createAnalysisPcm(samples), 'a'.repeat(64));
  const result = analyzeSections(frames);
  expect(result.changes.some((change) => change.kind === 'build')).toBe(true);
  expect(result.changes.filter((change) => change.kind === 'build')).toHaveLength(1);
  expect(
    result.changes.every(
      (change, index) => index === 0 || change.time - (result.changes[index - 1]?.time ?? 0) >= 8,
    ),
  ).toBe(true);
});

it('merges a late unexpected ending into a legal final region', () => {
  const samples = changingTone(20, (time) => (time < 18 ? 0.6 : 0));
  const frames = extractFrameFeatures(createAnalysisPcm(samples), 'a'.repeat(64));
  const result = analyzeSections(frames);
  expect(result.sections.every((section) => section.end - section.start >= 8)).toBe(true);
  expect(result.sections.at(-1)?.end).toBe(20);
  expect(result.changes.some((change) => change.kind === 'calm')).toBe(true);
});

it('does not split a steady tone and rejects unsupported region lengths', () => {
  const frames = extractFrameFeatures(
    createAnalysisPcm(createTone({ frequency: 440, seconds: 20, amplitude: 0.5 })),
    'a'.repeat(64),
  );
  expect(analyzeSections(frames).sections).toHaveLength(1);
  expect(() =>
    analyzeSections(frames, { minimumRegionSeconds: 1, contextSeconds: 2, noveltyThreshold: 0.15 }),
  ).toThrow();
});

it('detects a timbre-only boundary without claiming an energy drop', () => {
  const samples = Float32Array.from({ length: 24 * 22050 }, (_, index) => {
    const frequency = index < 12 * 22050 ? 100 : 5000;
    return 0.5 * Math.sin((2 * Math.PI * index * frequency) / 22050);
  });
  const frames = extractFrameFeatures(createAnalysisPcm(samples), 'a'.repeat(64));
  const result = analyzeSections(frames);
  expect(result.sections).toHaveLength(2);
  expect(Math.abs((result.sections[1]?.start ?? -10) - 12)).toBeLessThan(1);
  expect(result.changes.some((change) => change.kind === 'shift')).toBe(true);
  expect(result.changes.some((change) => change.kind === 'drop')).toBe(false);
});
