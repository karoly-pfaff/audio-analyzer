import { expect, it } from 'vitest';
import { createAnalysisPcm } from '../../contracts/analysisPcm.ts';
import { extractFrameFeatures } from './extractFrameFeatures.ts';
import { normalizeFeatureChannels } from './normalizeFeatureChannels.ts';
import { createTone } from '../../../tests/fixtures/audio/createTone.test-support.ts';

it('normalizes dynamics without making overall mastering gain a visual control', () => {
  const tone = createTone({ frequency: 200, seconds: 1 });
  const normal = extractFrameFeatures(createAnalysisPcm(tone), 'a'.repeat(64));
  const quiet = extractFrameFeatures(
    createAnalysisPcm(tone.map((sample) => sample * 0.25)),
    'b'.repeat(64),
  );
  expect(normalizeFeatureChannels(normal.raw).energy[20]).toBeCloseTo(
    normalizeFeatureChannels(quiet.raw).energy[20] ?? 0,
    5,
  );
  expect(normal.raw.rms[20]).toBeGreaterThan((quiet.raw.rms[20] ?? 0) * 3.9);
});

it('keeps near-silence from becoming full-scale activity and preserves sparse genuine transients', () => {
  const nearSilent = extractFrameFeatures(
    createAnalysisPcm(createTone({ frequency: 1000, seconds: 1, amplitude: 1e-8 })),
    'a'.repeat(64),
  );
  expect(nearSilent.channels.energy.every((value) => Math.abs(value) < 1e-12)).toBe(true);
  const samples = new Float32Array(22050);
  samples[11025] = 1;
  const sparse = extractFrameFeatures(createAnalysisPcm(samples), 'b'.repeat(64));
  expect(Math.max(...sparse.channels.energy)).toBeGreaterThan(0.9);
});
