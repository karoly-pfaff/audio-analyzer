import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { createHash } from 'node:crypto';

const forbid = (names) =>
  registerHooks({
    resolve(specifier, context, next) {
      if (names.includes(specifier)) throw new Error('Unexpected backend loaded: ' + specifier);
      return next(specifier, context);
    },
  });

let guard = forbid(['meyda', 'music-tempo']);
const { analyzeSignal } = await import('@karoly-pfaff/audio-analyzer/signal');

const { analyzeSpectrum, DEFAULT_SPECTRUM_SETTINGS } =
  await import('@karoly-pfaff/audio-analyzer/spectrum');

assert.equal(
  analyzeSignal({ channels: [new Float32Array([2, -4])], sampleRate: 48000 }).peakAmplitude,
  4,
);

const samples = Float32Array.from({ length: 4098 }, (_, index) =>
  Math.sin((2 * Math.PI * 1000 * index) / 48000),
);

const spectrum = analyzeSpectrum(
  { channels: [samples], sampleRate: 48000 },
  { ...DEFAULT_SPECTRUM_SETTINGS, bins: 1025 },
);

assert.ok(Math.abs(spectrum.centroidHz - 1000) < 50);
assert.equal(spectrum.maximumFrequencyHz, 24000);
guard.deregister();
guard = forbid(['meyda']);

const { estimateQuickTempo, getBpmRelation } = await import('@karoly-pfaff/audio-analyzer/tempo');

const pulses = Float32Array.from({ length: 48000 * 6 }, (_, index) =>
  index % 24000 < 480 ? 0.8 : 0,
);

const tempo = estimateQuickTempo({ channels: [pulses], sampleRate: 48000 });

assert.equal(tempo.status, 'estimated');
assert.ok(Math.abs(tempo.bpm - 120) < 0.5);
assert.equal(tempo.confidenceBasis, 'bpm-range-heuristic');
assert.equal(getBpmRelation(60, 119.9), 'halfDouble');
assert.equal(estimateQuickTempo(null, {}, { aborted: true }).status, 'cancelled');
guard.deregister();

const { analyzeAudio, createAnalysisPcm, createBeatPhase } =
  await import('@karoly-pfaff/audio-analyzer');

const timeline = analyzeAudio({
  pcm: createAnalysisPcm(new Float32Array(22050)),
  sourceSha256: 'a'.repeat(64),
  provenance: { pcmSha256: 'b'.repeat(64), decoderVersion: 'packed smoke v1' },
});

const expected = {
  timelineSha256: 'a198f06f2bc16e23aca84979c75b76b4f7e0bb4d0469ffbe2ac44c6f0897aa79',
};

assert.equal(
  createHash('sha256').update(JSON.stringify(timeline)).digest('hex'),
  expected.timelineSha256,
);
assert.equal(createBeatPhase(timeline, { ...timeline.rhythm, beats: timeline.beats }), null);
assert.equal('AudioBuffer' in globalThis, false);
for (const entry of ['', '/signal', '/spectrum', '/tempo'])
  assert.equal(
    import.meta
      .resolve('@karoly-pfaff/audio-analyzer' + entry)
      .replaceAll('\\', '/')
      .includes('/sources/'),
    false,
  );
console.log(
  'All four packed Node APIs and old musical hash passed; backend isolation enforced; no DOM or workspace source resolution.',
);
