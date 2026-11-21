# Repository layout

Authored code lives in sources/, generated output in build/. The root has 20 direct files
including the generated lockfile: package/tool/editor configuration, contributor contracts,
public README/changelog and MIT license remain at their standard discovery locations. This root
exception is intentional. Counts exclude dependencies, Git, build/coverage and ignored artifacts.

Musical contracts, envelope/spectrum/statistics features, onset/beat/periodicity/tracking and
sections retain their cohesive owners and colocated tests. Signal has contracts, statistics,
regions, envelopes and mono preparation; spectrum has contracts, FFT/window ownership and
analysis; tempo has contracts, estimation/declarations and relationships. Every source directory
has at most twelve direct files. The public root/signal/spectrum/tempo entries are actual package
boundaries, not internal forwarding barrels.

tests/fixtures/audio has six shared synthetic fixtures. tests/integration/consumer has its own
manifest, lockfile, TypeScript/Node/Vite/browser inputs. scripts/lint has six inherited rule/test
files, and scripts/ owns clean-build orchestration. Root jscpd and all
tool configurations cover their real authored paths; generated files stay ignored. Review and
document any directory above twelve direct files rather than creating arbitrary numbered groups.

docs/site owns one HTML shell, eight API/usage chapters, a standalone TypeScript project and
authored sources split into recipes, playground and interface/styles. scripts/documentation owns
seven focused build/render/reference/integrity modules; .github/workflows owns a manual Pages
workflow. Generated docs/site/build is ignored. Every added directory has at most twelve direct
files; the root direct-file count stays twenty. The site is documentation, not a package example.

Release operations live in scripts/release (ten direct modules/tests), with four archive-path/import
validation modules/tests under scripts/release/archive. docs/release owns the registry guide.
.github/workflows contains read-only quality, manual package publication and manual Pages workflows.
The token-free npm scope mapping stays at the root; artifacts and private checks remain ignored.
