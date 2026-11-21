import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { escapeHtml } from './html.mjs';
import { renderPublicReference } from './public-reference.mjs';

const CHAPTERS = [
  'overview',
  'music',
  'signal',
  'spectrum',
  'tempo',
  'hosts',
  'errors',
  'reference',
];

const RECIPES = ['musical', 'signal', 'envelope', 'spectrum', 'tempo', 'browser-pcm', 'worker'];

export function renderDocumentation(root) {
  const version = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version;
  const chapters = CHAPTERS.map((chapter) =>
    readFileSync(resolve(root, `docs/site/chapters/${chapter}.html`), 'utf8'),
  ).join('\n');
  const template = readFileSync(resolve(root, 'docs/site/index.html'), 'utf8');
  const html = template
    .replace('<!-- CHAPTERS -->', () => chapters)
    .replaceAll('<!-- PACKAGE_VERSION -->', escapeHtml(version));
  return insertRecipes(html, root).replace('<!-- API_REFERENCE -->', () =>
    renderPublicReference(root),
  );
}

function insertRecipes(html, root) {
  return RECIPES.reduce((current, recipe) => {
    const source = readFileSync(resolve(root, `docs/site/sources/recipes/${recipe}.ts`), 'utf8');
    const snippet = `<div class="snippet"><pre><button class="copy-button" data-copy type="button" aria-label="Copy ${recipe} TypeScript recipe">Copy</button><code>${escapeHtml(source)}</code></pre></div>`;
    return current.replace(`<!-- RECIPE:${recipe} -->`, () => snippet);
  }, html);
}
