# Quality and verification

The strictTypeChecked/stylisticTypeChecked ESLint presets, SonarJS, structural/naming limits and
the copied declaration-spacing/callable-naming/component-effect rules match Audio Controls React.
The [coding standards](coding-standards.md) are mandatory. Test exemptions cover only file and
function sizes and statement count. All complexity, nesting and correctness rules remain active.

Run npm ci, then npm run check. The serial gate packs a fresh clean build, installs the independent
consumer from that archive, and verifies Node execution, public types and Vite browser bundling.
It then checks formatting, strict lint, zero duplicate production/tooling blocks, Knip, TypeScript,
the inherited rule regressions and all-source Vitest coverage. Use one worker and bounded checks.

Coverage includes every sources/**/*.ts file, including unimported modules. Only colocated test
files are excluded. Every executable file requires 100% lines/statements/functions/branches.
Type-only modules are not hidden from the source scope. No broad coverage, lint, Knip or jscpd
exceptions are permitted. Knip entries are real public exports, executable scripts or consumers.
jscpd uses strict mode, four lines and fifty tokens, with a zero threshold.

The root MIT license applies to owned source; runtime dependencies retain their own licenses.
All source/dependency bounds, numerical failures and cancellation semantics must stay explicit.
The host owns native/browser compatibility, rendering/export and publication qualification.

The documentation gate compiles recipes, builds self-contained HTML and checks navigation,
unique IDs, complete templates and bundle syntax. Documentation TypeScript receives the same
strict lint/structure rules. jscpd and Knip include authored site modules; generated HTML stays
outside source checks. Library coverage remains all-source and per-file 100% in every metric.

Package preparation verifies scoped metadata, runtime/declaration import closure and the packed
consumer. Release guards have focused Node regressions. release:check validates the local archive
and report; publication additionally requires the matching repository/tag/workflow context.
