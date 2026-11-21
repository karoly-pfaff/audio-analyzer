import ts from 'typescript';

const TYPE_FLAGS = ts.TypeFormatFlags.NoTruncation + ts.TypeFormatFlags.InTypeAlias;

export function publicDeclarationText(symbol, context) {
  const declarations = symbol.getDeclarations();
  if (!declarations?.length) throw new Error('Missing declaration: ' + symbol.name);
  const text = declarations
    .map((declaration) => declarationText(symbol, declaration, context))
    .join('\n\n');
  const source = ts.createSourceFile('reference.ts', text, ts.ScriptTarget.Latest, true);
  return ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }).printFile(source).trim();
}

function declarationText(symbol, declaration, context) {
  if (ts.isTypeAliasDeclaration(declaration)) return typeAliasText(symbol, context);
  if (ts.isClassDeclaration(declaration)) return errorClassText(symbol, declaration, context);
  if (ts.isVariableDeclaration(declaration)) return declaration.parent.parent.getText();
  return declaration.getText();
}

function typeAliasText(symbol, context) {
  const type = context.checker.getDeclaredTypeOfSymbol(symbol);
  const body = hasIntersectedVariants(type)
    ? type.types.map((variant) => objectVariantText(variant, context)).join(' | ')
    : context.checker.typeToString(type, undefined, TYPE_FLAGS);
  return `export type ${symbol.name} = ${body};`;
}

function hasIntersectedVariants(type) {
  return type.isUnion() && type.types.some((variant) => variant.isIntersection());
}

function objectVariantText(type, context) {
  return (
    '{ ' +
    type
      .getProperties()
      .map((property) => propertyText(property, context))
      .join(' ') +
    ' }'
  );
}

function propertyText(property, context) {
  const declaration = propertyDeclaration(property);
  const type = context.checker.getTypeOfSymbolAtLocation(property, declaration);
  const readonly = declaration.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword,
  )
    ? 'readonly '
    : '';
  const optional = declaration.questionToken ? '?' : '';
  return `${readonly}${property.name}${optional}: ${context.checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation)};`;
}

function errorClassText(symbol, declaration, context) {
  const instance = context.checker.getDeclaredTypeOfSymbol(symbol);
  const code = instance.getProperty('code');
  if (!code) throw new Error('Missing public error code: ' + symbol.name);
  const codeType = context.checker.getTypeOfSymbolAtLocation(code, declaration);
  return declaration
    .getText()
    .replaceAll(
      'keyof typeof MESSAGES',
      context.checker.typeToString(codeType, undefined, TYPE_FLAGS),
    );
}

function propertyDeclaration(property) {
  const declaration = property.valueDeclaration ?? property.getDeclarations()?.[0];
  if (!declaration) throw new Error('Missing result property: ' + property.name);
  return declaration;
}
