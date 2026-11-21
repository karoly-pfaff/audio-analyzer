import ts from 'typescript';
import { posix } from 'node:path';

export function packageImportIssues(sources, manifest) {
  return Array.from(sources).flatMap(([file, source]) =>
    referencedModules(file, source).flatMap((specifier) =>
      referenceIssues({ file, specifier, sources, manifest }),
    ),
  );
}

function referencedModules(file, source) {
  const syntax = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const references = [];
  function visit(node) {
    const specifier = referencedSpecifier(node);
    if (specifier && ts.isStringLiteral(specifier)) references.push(specifier.text);
    ts.forEachChild(node, visit);
  }
  visit(syntax);
  return references;
}

function referencedSpecifier(node) {
  if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return node.moduleSpecifier;
  if (ts.isImportTypeNode(node)) return node.argument.literal;
  if (ts.isCallExpression(node)) return importArgument(node);
  return undefined;
}

function importArgument(node) {
  if (node.expression.kind === ts.SyntaxKind.ImportKeyword) return node.arguments[0];
  if (ts.isIdentifier(node.expression) && node.expression.text === 'require')
    return node.arguments[0];
  return undefined;
}

function referenceIssues(context) {
  if (context.specifier.startsWith('.')) return relativeReferenceIssues(context);
  const parts = context.specifier.split('/');
  const dependency = context.specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  return Object.hasOwn(context.manifest.dependencies ?? {}, dependency)
    ? []
    : [`Undeclared runtime dependency in ${context.file}: ${context.specifier}`];
}

function relativeReferenceIssues(context) {
  const target = posix.normalize(posix.join(posix.dirname(context.file), context.specifier));
  if (!target.startsWith('build/'))
    return [`Import escapes package build: ${context.file} -> ${context.specifier}`];
  const resolved = declarationTarget(context.file, target);
  return context.sources.has(resolved)
    ? []
    : [`Missing package module: ${context.file} -> ${resolved}`];
}

function declarationTarget(file, target) {
  if (!file.endsWith('.d.ts') || target.endsWith('.d.ts')) return target;
  return target.replace(/\.(?:js|tsx?)$/, '.d.ts');
}
