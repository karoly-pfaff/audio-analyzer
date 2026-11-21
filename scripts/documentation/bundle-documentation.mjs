import { build } from 'vite';

export async function bundleDocumentation(entry) {
  const bundle = await build({
    configFile: false,
    define: { 'process.env.NODE_ENV': '"production"' },
    build: {
      lib: { entry, name: 'AudioAnalyzerDocumentation', formats: ['iife'] },
      write: false,
      cssCodeSplit: false,
      minify: true,
      sourcemap: false,
    },
  });
  const outputs = Array.isArray(bundle) ? bundle.flatMap((result) => result.output) : bundle.output;
  const chunks = outputs.filter((output) => output.type === 'chunk');
  if (chunks.length !== 1) throw new Error('Documentation requires one self-contained script.');
  return {
    script: chunks[0].code,
    style: outputs
      .filter((output) => output.type === 'asset')
      .map(stylesheetText)
      .join('\n'),
  };
}

function stylesheetText(asset) {
  if (!asset.fileName.endsWith('.css')) throw new Error('Unexpected external documentation asset.');
  return typeof asset.source === 'string' ? asset.source : new TextDecoder().decode(asset.source);
}
