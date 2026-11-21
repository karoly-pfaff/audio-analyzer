import ts from 'typescript';
import { resolve } from 'node:path';
import { escapeHtml } from './html.mjs';
import { publicDeclarationText } from './reference-declarations.mjs';

const ENTRIES = { musical: 'index', signal: 'signal', spectrum: 'spectrum', tempo: 'tempo' };

export function renderPublicReference(root) {
  const paths = Object.values(ENTRIES).map((entry) => resolve(root, `build/${entry}.d.ts`));
  const program = ts.createProgram(paths, {
    module: ts.ModuleKind.NodeNext,
    strict: true,
    skipLibCheck: true,
  });
  const checker = program.getTypeChecker();
  return Object.entries(ENTRIES)
    .map(([profile, entry]) => renderEntry({ profile, entry, root, program, checker }))
    .join('\n');
}

function renderEntry(context) {
  const source = context.program.getSourceFile(
    resolve(context.root, `build/${context.entry}.d.ts`),
  );
  const moduleSymbol = source && context.checker.getSymbolAtLocation(source);
  if (!moduleSymbol) throw new Error('Missing built public entry: ' + context.entry);
  const symbols = context.checker
    .getExportsOfModule(moduleSymbol)
    .sort((left, right) => left.name.localeCompare(right.name, 'en'));
  const packageEntry =
    context.profile === 'musical'
      ? '@karoly-pfaff/audio-analyzer'
      : '@karoly-pfaff/audio-analyzer/' + context.profile;
  const symbolNames = new Set(symbols.map((symbol) => symbol.name));
  return (
    `<h3>${escapeHtml(packageEntry)}</h3>` +
    symbols.map((symbol) => renderSymbol(symbol, { ...context, symbolNames })).join('\n')
  );
}

function renderSymbol(symbol, context) {
  const target =
    symbol.flags === ts.SymbolFlags.Alias ? context.checker.getAliasedSymbol(symbol) : symbol;
  const body = symbol.name.endsWith('Schema')
    ? schemaDescription(symbol.name, context)
    : `<pre><code>${escapeHtml(publicDeclarationText(target, context))}</code></pre>`;
  return `<details id="api-${context.profile}-${escapeHtml(symbol.name)}" data-api-symbol="${escapeHtml(symbol.name)}"><summary><code>${escapeHtml(symbol.name)}</code></summary>${body}</details>`;
}

function schemaDescription(name, context) {
  const typeName = name[0].toUpperCase() + name.slice(1, -'Schema'.length);
  if (!context.symbolNames.has(typeName))
    throw new Error('Missing documented schema result: ' + typeName);
  return `<p>Validates <a href="#api-${context.profile}-${typeName}"><code>${typeName}</code></a>. <code>${name}.parse(value)</code> returns the validated value or throws a validation error. <code>${name}.safeParse(value)</code> returns a success/data or error result.</p>`;
}
