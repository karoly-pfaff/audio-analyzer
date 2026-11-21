# GitHub Packages release

## Target and package identity

- Repository: `karoly-pfaff/audio-analyzer`, intended to be public.
- Package: `@karoly-pfaff/audio-analyzer`, version `0.1.0`, intended to be public.
- Registry: `https://npm.pkg.github.com`.
- License: MIT, provided by the root LICENSE.
- Documentation target: `https://karoly-pfaff.github.io/audio-analyzer/`.

Repository visibility and npm package visibility are separate settings. GitHub initially publishes
npm packages as private; change package visibility explicitly after the first publication. An npm
access flag does not replace this GitHub setting. This guide describes the release process; the
public API guide contains only installation, usage, settings, result interpretation and examples.

## Local candidate

Use Node 24.18.1 and npm 11.16.0 as recorded by the repository:

```sh
npm ci --ignore-scripts
npm run check
npm run release:check
```

The serial check starts with package:check, so the independent consumer is installed before typed
lint. That command builds the library, packs it, checks archive paths and module/declaration
references, and installs the exact archive into tests/integration/consumer. The consumer checks
public declarations, executes all analysis entries in Node and bundles them for a browser.
It also verifies backend isolation, DOM independence and the canonical musical timeline hash.

For a focused packaging check, run npm run package:check followed by npm run release:check.
Use one worker and bounded serial checks. No host applications, GPU, export or benchmark work is
needed to qualify this package boundary.

Generated candidates live in ignored artifacts/:

- `karoly-pfaff-audio-analyzer-0.1.0.tgz`: versioned publication archive.
- `audio-analyzer.tgz`: identical stable local filename for the integration fixture.
- `package-report.json`: actual npm file list, integrity, SHA-256 and workflow source commit
  (null for a local candidate).

Root and consumer package-lock.json files stay tracked. The consumer lockfile is refreshed for
the current archive bytes, while its file dependency uses the stable archive filename.
Allowed archive content is compiled build/ JavaScript/declarations and package.json, README.md,
CHANGELOG.md and LICENSE. Authored sources, tests, docs output/tools, workflow files, credentials
and local records do not belong in the npm archive. Relative runtime/declaration imports must
resolve to packed files; external imports must use declared runtime dependencies.

## Repository and workflow setup

Create the public repository and upload the reviewed source when separately authorized. Keep the
first release commit and v0.1.0 tag aligned. The Library quality workflow checks pull requests,
main pushes and manual dispatches with contents:read; it does not publish packages.

The GitHub Packages candidate workflow is manual. Its publish input defaults to false, allowing
candidate validation before publication. It uses the github-packages environment; configure any
required reviewer or deployment ref rules in repository settings. Referencing an environment name
does not itself create review protection. Environment rules must allow the refs used for validation
as well as the intended release tags.

Publishing uses the repository GITHUB_TOKEN with packages:write. Only the final publication step
receives NODE_AUTH_TOKEN. No credential is committed. The root .npmrc maps only @karoly-pfaff to
GitHub Packages; unrelated dependencies keep their usual registry. Do not add tokens to this file.

The existing Documentation Pages workflow remains an independent manual deployment. Select GitHub
Actions as the Pages source when enabling it; see [documentation maintenance](../site/README.md).
Neither the package candidate nor Library quality workflow publishes the documentation automatically.

## Validate and publish

1. Run the local candidate and quality checks, review the source and upload the intended release commit.
2. Run GitHub Packages candidate with version=0.1.0 and publish=false. Review its archive report,
   consumer results and quality/coverage results.
3. Create v0.1.0 on the reviewed release commit.
4. Dispatch that exact tag with version=0.1.0 and publish=true.
5. The workflow repeats checks, verifies the tag/repository/version, archive digest and source
   commit, then publishes that exact archive with the latest dist-tag.
6. In GitHub package settings, verify the repository association and set package visibility to public.
7. Verify authenticated installation of the exact registry version in an independent consumer.

Local publishing, a false publish dispatch, another repository, a branch ref or a mismatched tag
are rejected by the release guards. Direct npm publish invokes prepublishOnly; release:publish
also checks the candidate checksum, workflow commit and token availability before executing npm.
The publisher uses --ignore-scripts only after those checks to preserve the verified tarball.

Stable x.y.z versions are accepted. Once published, use a new version for later changes; do not
replace a released version. Define a separate prerelease/dist-tag policy before publishing betas.
Hosted workflow execution, registry authentication and public visibility must be checked during
publication; local preparation does not establish that they already work remotely.

## Consumer installation

GitHub's npm registry requires authentication even for public packages. On a developer machine,
use a personal access token (classic) with read:packages through npm login. Keep credentials in
user-level configuration. Never put the token in a committed project file or a chat message.

```sh
npm login --scope=@karoly-pfaff --auth-type=legacy --registry=https://npm.pkg.github.com
npm config set @karoly-pfaff:registry=https://npm.pkg.github.com --location=project
npm install --save-exact @karoly-pfaff/audio-analyzer@0.1.0
```

Imports remain the scoped root, /signal, /spectrum and /tempo entries. A registry migration must
replace a host's file dependency and lockfile deliberately, then run its targeted integration
checks. ParticleScore's existing vendor archive and coverage receipt remain the current host
dependency until the registry package has actually been published and verified.

Consumer Actions jobs should use packages:read and an appropriate registry mapping. Grant package
access to consumer repositories where necessary; installation jobs do not need write permission.

References:

- [GitHub npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
- [Package permissions and visibility](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility)
- [Publishing packages with Actions](https://docs.github.com/en/packages/learn-github-packages/publishing-a-package/publishing-a-package-using-github-actions)
