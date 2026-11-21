import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertCandidateMetadata,
  assertCandidateDigest,
  candidateFilename,
  candidateDigest,
} from './candidate-report.mjs';

const MANIFEST = { name: '@karoly-pfaff/audio-analyzer', version: '0.1.0' };

test('binds candidate identity to the actual archive bytes', () => {
  const bytes = Buffer.from('candidate archive');
  const report = {
    ...MANIFEST,
    filename: candidateFilename(MANIFEST),
    sha256: candidateDigest(bytes),
  };
  assert.doesNotThrow(() => {
    assertCandidateMetadata(report, MANIFEST);
  });
  assert.doesNotThrow(() => {
    assertCandidateDigest(report, bytes);
  });
  assert.throws(() => {
    assertCandidateDigest(report, Buffer.from('tampered archive'));
  });
});

test('rejects mismatched names, versions and candidate paths', () => {
  const report = { ...MANIFEST, filename: candidateFilename(MANIFEST) };
  for (const override of [
    { name: '@other/audio-analyzer' },
    { version: '1.0.0' },
    { filename: '../escape.tgz' },
  ])
    assert.throws(() => {
      assertCandidateMetadata({ ...report, ...override }, MANIFEST);
    });
});
