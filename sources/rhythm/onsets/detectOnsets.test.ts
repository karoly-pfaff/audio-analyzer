import { expect, it } from 'vitest';
import { createAnalysisPcm } from '../../contracts/analysisPcm.ts';
import { extractFrameFeatures } from '../../features/spectrum/extractFrameFeatures.ts';
import { detectOnsets } from './detectOnsets.ts';
import { createPulseTrain } from '../../../tests/fixtures/audio/createPulseTrain.test-support.ts';
import { createTone } from '../../../tests/fixtures/audio/createTone.test-support.ts';

it('finds known percussive onsets within 40ms without duplicate events', () => {
  const fixture = createPulseTrain({ bpm: 120, seconds: 8 });
  const frames = extractFrameFeatures(createAnalysisPcm(fixture.samples), 'a'.repeat(64));
  const events = detectOnsets(frames);
  expect(events).toHaveLength(fixture.onsets.length);
  expect(
    events.every((event, index) => Math.abs(event.time - (fixture.onsets[index] ?? -1)) <= 0.04),
  ).toBe(true);
  expect(events.every((event) => event.confidence > 0.5)).toBe(true);
  expect(detectOnsets(frames)).toEqual(events);
});

it('does not invent events for silence or near-silent tonal noise', () => {
  expect(
    detectOnsets(extractFrameFeatures(createAnalysisPcm(new Float32Array(22050)), 'a'.repeat(64))),
  ).toEqual([]);
  const quiet = createTone({ frequency: 1000, seconds: 1, amplitude: 1e-8 });
  expect(detectOnsets(extractFrameFeatures(createAnalysisPcm(quiet), 'a'.repeat(64)))).toEqual([]);
});

it('rejects invalid detector settings', () => {
  const frames = extractFrameFeatures(createAnalysisPcm(new Float32Array(1024)), 'a'.repeat(64));
  expect(() =>
    detectOnsets(frames, { minimumGapSeconds: -1, thresholdMultiplier: 1, madMultiplier: 1 }),
  ).toThrow();
});

it('keeps the strongest attack inside the minimum gap and does not count weaker echoes', () => {
  const frames = extractFrameFeatures(createAnalysisPcm(new Float32Array(22050)), 'a'.repeat(64));
  const flux = Array<number>(frames.raw.flux.length).fill(0);
  flux[8] = 0.2;
  flux[12] = 0.8;
  flux[17] = 0.3;
  flux[35] = 0.5;
  const events = detectOnsets({
    ...frames,
    raw: { ...frames.raw, flux, rms: flux.map(() => 0.1) },
  });
  expect(events.map((event) => event.id)).toEqual([
    'onset-aaaaaaaaaaaa-12',
    'onset-aaaaaaaaaaaa-35',
  ]);
  expect(events[0]?.strength).toBe(1);
});

it('rejects a flat elevated flux floor through its adaptive threshold', () => {
  const frames = extractFrameFeatures(createAnalysisPcm(new Float32Array(22050)), 'a'.repeat(64));
  expect(
    detectOnsets({
      ...frames,
      raw: {
        ...frames.raw,
        flux: frames.raw.flux.map(() => 0.2),
        rms: frames.raw.rms.map(() => 0.1),
      },
    }),
  ).toEqual([]);
});

it('retains weak genuine attacks while suppressing the release of louder pulses', () => {
  const fixture = createPulseTrain({ bpm: 120, seconds: 4 });
  for (let index = 22050; index < 22050 * 1.4; index += 1)
    fixture.samples[index] = (fixture.samples[index] ?? 0) * 0.1;
  const events = detectOnsets(
    extractFrameFeatures(createAnalysisPcm(fixture.samples), 'a'.repeat(64)),
  );
  expect(events).toHaveLength(fixture.onsets.length);
  expect(events.some((event) => Math.abs(event.time - 1) < 0.04 && event.strength < 0.2)).toBe(
    true,
  );
});
