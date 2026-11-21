# Documentation maintenance

Run `npm ci`, then `npm run docs:build`. Open [the generated guide](build/index.html) directly,
or serve `docs/site/build` using a local static server. The single HTML file includes its CSS,
JavaScript, real analysis recipes and public declarations; it needs no CDN or runtime network.
The musical demo's content hash uses Web Crypto, available on file URLs and secure contexts
(including localhost). Production hosting should use HTTPS.

Run `npm run docs:check` for the build plus navigation/template/bundle integrity checks. The root
typecheck includes the separate site project, lint/Knip/jscpd include authored site modules, and
the serial acceptance gate includes docs:check. Library sources and coverage floors are unchanged.

## Authoring

- `index.html`: semantic shell, navigation, accessible controls and insertion markers.
- `chapters/*.html`: eight ordered chapters covering API usage, PCM integration, errors and reference.
- `sources/recipes/*.ts`: checked TypeScript shown verbatim in the guide. The playground uses
  the same analysis recipes; the browser PCM and worker recipes document host boundaries.
- `sources/playground`: bounded synthetic inputs, result preparation, rendering and event wiring.
- `sources/styles.css`: light/dark palette and responsive layout. Change CSS variables to customize.
- `scripts/documentation`: self-contained bundling, chapter/snippet rendering, TypeScript-derived
  public reference and output integrity checks.

Keep generated output in ignored `build/`. Document observable API behavior and units without
personal decisions or work logs. Keep library package installation independent of documentation.
No audio upload or microphone access is part of the playground. Start expensive real-track work
in a host worker; the short synthetic examples execute on the documentation page's thread.

## GitHub Pages

The manual **Documentation Pages** workflow is ready for a future GitHub repository. After the
repository is published, select **Settings → Pages → Source: GitHub Actions**, then run it from
the intended branch. It installs locked dependencies, builds/checks the guide, uploads only
`docs/site/build`, and deploys using the `github-pages` environment. Review that environment's
protection rules and the deployment URL. No package publication is triggered.

The artifact is independent of the repository subpath: `/audio-analyzer/` and deeper preview
directories need no base-path rewrite. [GitHub's custom workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
documents the artifact, permissions and environment requirements. The workflow has not been
executed remotely as part of this local documentation preparation.

## Build output and appearance

The build writes `docs/site/build/index.html` and `.nojekyll`. CSS, JavaScript and the API
declarations are included in the HTML, so the artifact can be served below a repository subpath.
The Pages workflow requests read-only contents access in its build job; its deployment job
requests pages:write and id-token:write. The workflow deploys documentation independently of npm
package publication.

Change `sources/styles.css` to customize the documentation theme, then rebuild:

```css
:root {
  --accent: #087d6d;
  --page: #f7f8f5;
  --content-width: 68rem;
}
:root[data-theme='dark'] {
  --accent: #58d7bd;
  --page: #101916;
}
```

The theme starts light on each load and is not persisted. Guide text, navigation and declarations
remain readable without JavaScript; the examples, filter, copy buttons and theme switch use it.
Keep build, deployment and site-maintenance instructions here rather than in the published API
guide.

Public reference rendering resolves inferred result shapes and error-code unions; schema entries
link to the public types they validate. Keep dependency declarations, private type identifiers and
repository/release workflows out of the usage guide. Inline TypeScript examples are marked with
data-ts-example; data-ts-prepend identifies a displayed recipe that supplies their shared context.

The Library quality and package candidate workflows build this same static guide without deploying
it. The Documentation Pages workflow remains the separate deployment entry. Package publication
operations belong in [the registry guide](../release/github-packages.md).
