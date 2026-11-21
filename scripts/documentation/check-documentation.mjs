import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const HTML = readFileSync(new URL('../../docs/site/build/index.html', import.meta.url), 'utf8');
const IDS = Array.from(HTML.matchAll(/\bid="([^"]+)"/g), (match) => match[1]);
const LINKS = Array.from(HTML.matchAll(/href="#([^"]+)"/g), (match) => match[1]);
const SCRIPTS = Array.from(HTML.matchAll(/<script>([\s\S]*?)<\/script>/g), (match) => match[1]);

assert.equal(new Set(IDS).size, IDS.length, 'Duplicate document IDs.');
assert.ok(
  LINKS.every((target) => IDS.includes(target)),
  'Broken internal navigation.',
);
assert.ok(
  !/<!-- (CHAPTERS|RECIPE:|API_REFERENCE|PACKAGE_VERSION)|\/\* DOCUMENTATION_/.test(HTML),
  'Unrendered template.',
);
assert.ok(
  !/<(?:script|link|img)\b[^>]*(?:src|href)=["']https?:/i.test(HTML),
  'Unexpected external asset.',
);
assert.ok(
  !/<(?:script|link)\b[^>]*(?:src|href)=/i.test(HTML),
  'Documentation must be self-contained.',
);
assert.equal(SCRIPTS.length, 1, 'Expected one inline bundle.');
for (const script of SCRIPTS)
  execFileSync(process.execPath, ['--check', '--input-type=commonjs'], { input: script });
assert.ok(IDS.some((identifier) => identifier === 'api-musical-analyzeAudio'));
assert.ok(IDS.some((identifier) => identifier === 'api-tempo-QuickTempoResult'));
console.log(
  'Documentation integrity: unique IDs, valid anchors, complete templates and standalone script passed.',
);
