import { expect, it } from 'vitest';
import { createAnalysisPcm } from '../../contracts/analysisPcm.ts';
import { extractFrameFeatures } from '../spectrum/extractFrameFeatures.ts';
import { createOnsetEnvelope } from './createOnsetEnvelope.ts';

it('maps a detected event to one source-clock impulse with a bounded release tail', () => {
  const frames = extractFrameFeatures(createAnalysisPcm(new Float32Array(22050)), 'a'.repeat(64));
  const envelope = createOnsetEnvelope(frames, [
    { id: 'onset-aaaaaaaaaaaa-20', time: 20 / frames.featureHz, strength: 0.8, confidence: 1 },
  ]);
  expect(envelope).toHaveLength(frames.raw.rms.length);
  expect(envelope[19]).toBe(0);
  expect(envelope[20]).toBeCloseTo(0.8);
  expect(envelope[30]).toBeGreaterThan(0);
  expect(envelope[30]).toBeLessThan(0.8);
});

it('rejects events outside the source duration or from another fingerprint', () => {
  const frames = extractFrameFeatures(createAnalysisPcm(new Float32Array(22050)), 'a'.repeat(64));
  expect(() =>
    createOnsetEnvelope(frames, [
      { id: 'onset-aaaaaaaaaaaa-200', time: 2, strength: 1, confidence: 1 },
    ]),
  ).toThrow();
  expect(() =>
    createOnsetEnvelope(frames, [
      { id: 'onset-bbbbbbbbbbbb-20', time: 0.2, strength: 1, confidence: 1 },
    ]),
  ).toThrow();
});
