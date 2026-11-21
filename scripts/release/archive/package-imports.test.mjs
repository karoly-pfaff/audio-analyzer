import assert from 'node:assert/strict';
import test from 'node:test';
import { packageImportIssues } from './package-imports.mjs';

const MANIFEST = { dependencies: { zod: '4.6.7', '@scope/runtime': '1.0.0' } };

test('resolves compiled JS and TypeScript declaration suffixes inside the archive', () => {
  const sources = new Map([
    ['build/index.js', "export { value } from './signal/value.js';"],
    ['build/index.d.ts', "export { value } from './signal/value.ts';"],
    ['build/signal/value.js', "import { z } from 'zod';"],
    ['build/signal/value.d.ts', "export declare const value: import('zod').ZodType;"],
  ]);
  assert.deepEqual(packageImportIssues(sources, MANIFEST), []);
});

test('checks missing runtime, declaration and literal dynamic imports', () => {
  for (const [path, source] of [
    ['build/index.js', "export { value } from './missing.js';"],
    ['build/index.d.ts', "export type Value = import('./missing.ts').Value;"],
    ['build/index.js', "const load = () => import('./missing.js');"],
    ['build/index.js', "const dependency = require('./missing.js');"],
  ])
    assert.ok(
      packageImportIssues(new Map([[path, source]]), MANIFEST).some((issue) =>
        issue.startsWith('Missing package module:'),
      ),
    );
});

test('rejects package-root escapes and undeclared dependencies', () => {
  assert.ok(
    packageImportIssues(new Map([['build/index.js', "import '../private.js';"]]), MANIFEST).some(
      (issue) => issue.startsWith('Import escapes'),
    ),
  );
  for (const source of [
    "import 'unknown-package';",
    "import 'node:fs';",
    "import { value } from '@scope/dev-only';",
  ])
    assert.ok(
      packageImportIssues(new Map([['build/index.js', source]]), MANIFEST).some((issue) =>
        issue.startsWith('Undeclared runtime dependency'),
      ),
    );
});

test('allows declared package subpaths and direct declaration references', () => {
  assert.deepEqual(
    packageImportIssues(
      new Map([
        ['build/index.d.ts', "export { Value } from './value.d.ts';"],
        ['build/value.d.ts', "import { Value } from '@scope/runtime/types';"],
      ]),
      MANIFEST,
    ),
    [],
  );
});
