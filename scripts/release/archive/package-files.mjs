import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { packageImportIssues } from './package-imports.mjs';

const ROOT_FILES = ['package.json', 'README.md', 'LICENSE', 'CHANGELOG.md'];

const REQUIRED_BUILD = ['index', 'signal', 'spectrum', 'tempo'].flatMap((entry) => [
  `build/${entry}.js`,
  `build/${entry}.d.ts`,
]);

export function packageFileIssues(paths) {
  const unexpected = paths
    .filter((path) => !isPackageFile(path))
    .map((path) => 'Unexpected package file: ' + path);
  const missing = [...ROOT_FILES, ...REQUIRED_BUILD]
    .filter((path) => !paths.includes(path))
    .map((path) => 'Missing package file: ' + path);
  const duplicates = new Set(paths).size === paths.length ? [] : ['Duplicate package file paths.'];
  return [...unexpected, ...missing, ...duplicates];
}

function isPackageFile(path) {
  if (ROOT_FILES.includes(path)) return true;
  return (
    /^build\/(?:[a-z0-9-]+\/)*[A-Za-z][A-Za-z0-9.-]*\.(?:js|d\.ts)$/.test(path) &&
    !/\.(?:test(?:-support)?|spec)\./.test(path)
  );
}

export function inspectPackageFiles(root, files, manifest) {
  const paths = files.map((file) => file.path);
  const issues = packageFileIssues(paths);
  if (issues.length) throw new Error(issues.join('\n'));
  const sources = new Map(
    paths
      .filter((path) => path.startsWith('build/'))
      .map((path) => [path, readFileSync(resolve(root, path), 'utf8')]),
  );
  const imports = packageImportIssues(sources, manifest);
  if (imports.length) throw new Error(imports.join('\n'));
}
