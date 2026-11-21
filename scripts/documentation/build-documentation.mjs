import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, basename } from 'node:path';
import { renderDocumentation } from './render-documentation.mjs';
import { bundleDocumentation } from './bundle-documentation.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT = resolve(ROOT, 'docs/site/build');
const BUNDLE = await bundleDocumentation(resolve(ROOT, 'docs/site/sources/main.ts'));

const HTML = renderDocumentation(ROOT)
  .replace('/* DOCUMENTATION_STYLES */', () => BUNDLE.style.replaceAll('</style', '<\\/style'))
  .replace('/* DOCUMENTATION_SCRIPT */', () => BUNDLE.script.replaceAll('</script', '<\\/script'));

if (dirname(OUTPUT) !== resolve(ROOT, 'docs/site') || basename(OUTPUT) !== 'build')
  throw new Error('Documentation output must stay inside docs/site/build.');
await rm(OUTPUT, { recursive: true, force: true });
await mkdir(OUTPUT, { recursive: true });
await writeFile(resolve(OUTPUT, 'index.html'), HTML);
await writeFile(resolve(OUTPUT, '.nojekyll'), '');
console.log('GitHub Pages documentation: ' + resolve(OUTPUT, 'index.html'));
