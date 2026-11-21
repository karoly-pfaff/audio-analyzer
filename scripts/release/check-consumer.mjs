import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PACKAGE_ROOT, runNpm } from './run-npm.mjs';
import { readCandidate, assertCandidateDigest } from './candidate-report.mjs';

const CANDIDATE = readCandidate();

assertCandidateDigest(
  CANDIDATE,
  readFileSync(resolve(PACKAGE_ROOT, 'artifacts/audio-analyzer.tgz')),
);

const FIXTURE = resolve(PACKAGE_ROOT, 'tests/integration/consumer');

console.log(
  runNpm(
    [
      'install',
      '@karoly-pfaff/audio-analyzer@file:../../../artifacts/audio-analyzer.tgz',
      '--force',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
    ],
    FIXTURE,
  ),
);
console.log(runNpm(['run', 'check'], FIXTURE));
