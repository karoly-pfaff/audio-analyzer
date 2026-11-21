# Audio Analyzer contributor rules

Read [coding standards](docs/development/coding-standards.md),
[code quality](docs/development/code-quality.md), [architecture](docs/architecture.md) and
[repository layout](docs/development/repository-layout.md) before changing code or tooling.
CLAUDE.md points to this same canonical contract.

## Package boundaries

This independent offline TypeScript library owns musical analysis, original-signal measurements,
display spectrum and quick BPM through separate public entries. Keep host decoding, resampling,
playback, UI, workers, queues, cancellation execution, storage and services outside the package.
Runtime imports create no audio contexts, workers, listeners or outbound requests. Preserve the
musical timeline schema, algorithm identity, source clocks and pinned numerical fixture hashes.

## Mandatory source rules

Use English, strict TypeScript, explicit units, readonly contracts, explicit public return types,
type-only imports and validation of unknown boundary data. No any or unchecked casts concealing
missing validation. Authored code lives in sources/; generated output in build/. Each analytical
responsibility has its own directory and colocated tests; no miscellaneous shared/common layer.
Preserve 200 nonblank/noncomment lines per file, 40 per function, eight statements, cyclomatic
complexity six, cognitive complexity eight, nesting depth two, three parameters and two nested
callbacks. No nested ternaries. Enforce declaration spacing and callable naming. Inherited
component/effect rules remain enabled; runtime UI is outside the package boundary.

Unit tests sit beside their module with the same basename and .test.ts/.test.mjs suffix.
Central tests/ owns shared fixtures and packed-package integration only. Test exemptions cover
file/function size and statement count, never complexity or correctness. Review directories above
12 direct files, including tests/configuration/assets, and record ownership reasons in the layout.

## Quality and coverage

npm run check is the serial acceptance gate: a clean build and independent package consumer,
formatting, strict code lint, zero-duplication jscpd, Knip, typecheck, tooling regressions and
all-source library coverage. Every executable production file must reach 100% lines, statements,
functions AND branches. A global average cannot hide a per-file shortfall. Include unimported
production sources. Do not exclude sources, lower thresholds, add broad ignores, mark dead code
as an entry or discard failing cases. Fix the implementation and meaningful behavior tests.
Update imports, public entries, tooling and ownership documentation together when moving source.
Keep generated output out of Git. Inspect actual tarballs and independent consumers. Preserve MIT LICENSE.

## Workflow and resources

Use npm and preserve both root and integration-consumer package-lock.json files. Keep unrelated
repositories intact. Use codex/ branches and local Git. Remote operations, publication and releases
require explicit authorization. A configured gate is not a passed result. Keep checks serial with
one worker; avoid host/GPU/export/long performance campaigns. Report actual results and limits.
The npm scripts bind package identity @karoly-pfaff/audio-analyzer and the four public entries.
The package metadata is prepared for public GitHub Packages publication. Actual remote setup,
publishing and visibility changes still require explicit authorization.

## Configuration and documentation

jscpd.json and all tool configurations live at the root. scripts/lint owns inherited rules/tests.
tests/integration/consumer owns its separate strict TypeScript/Vite/Node project. Root TypeScript
checks library/fixtures, while npm run typecheck also checks both independent consumer and
documentation projects. docs/site owns the detailed HTML guide, compiled recipes and playground.
Keep docs:check in the serial gate; generated docs/site/build stays ignored.
Document current APIs, numerical semantics, ownership and operations. The public guide explains
inputs, settings, results and usage; keep development-quality metrics in contributor documentation.
Avoid promotional slogans, export-count banners and test-coverage claims in the usage guide.
Build, GitHub Pages deployment and documentation-theme maintenance belong in docs/site/README.md,
not in the published API guide. Do not add dated work logs,
conversation/approval history or personal decisions. Report executed checks in the task response.

## GitHub Packages release

The target is @karoly-pfaff/audio-analyzer on https://npm.pkg.github.com, associated with
karoly-pfaff/audio-analyzer. MIT and all four public entries remain part of the release contract.
Keep tokens out of committed files and keep repository/package visibility separate.

Run npm ci, npm run check, then npm run release:check for a complete local candidate. check begins
with package:check to build, inspect and install the archive before typed consumer lint. The
versioned archive and identical stable fixture copy are ignored artifacts. Update the consumer
lockfile for changed archive bytes.

Publication uses the manual matching-version-tag workflow and exact validated archive. Preserve
the context, digest and source-commit guards. See [release operations](docs/release/github-packages.md).
Public API documentation must not contain release workflows or repository maintenance instructions.
