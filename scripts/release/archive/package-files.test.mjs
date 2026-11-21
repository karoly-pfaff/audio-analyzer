import assert from 'node:assert/strict';
import test from 'node:test';
import { packageFileIssues } from './package-files.mjs';

const FILES = [
  'package.json',
  'README.md',
  'LICENSE',
  'CHANGELOG.md',
  ...['index', 'signal', 'spectrum', 'tempo'].flatMap((entry) => [
    `build/${entry}.js`,
    `build/${entry}.d.ts`,
  ]),
];

test('requires the four compiled APIs, declarations and package/legal files', () => {
  assert.deepEqual(
    packageFileIssues([...FILES, 'build/signal/contracts/SignalAnalysisError.js']),
    [],
  );
  for (const required of FILES)
    assert.ok(
      packageFileIssues(FILES.filter((file) => file !== required)).some((issue) =>
        issue.includes(required),
      ),
    );
});

test('rejects authored sources, credentials, test output and path escapes', () => {
  for (const path of [
    '.npmrc',
    '.env',
    'sources/index.ts',
    'docs/site/build/index.html',
    'build/../.env',
    'build/foo.test.js',
    'build/foo.test-support.d.ts',
    'build/foo.spec.js',
    'build/.env',
    'build/index.js.map',
  ])
    assert.ok(packageFileIssues([...FILES, path]).some((issue) => issue.includes(path)));
});

test('rejects duplicate archive file paths', () => {
  assert.ok(
    packageFileIssues([...FILES, 'build/index.js']).includes('Duplicate package file paths.'),
  );
});
