# Dependency security update — 16 October 2026

## Result

Render previously reported 45 findings. A fresh local audit before remediation reported 44 findings (1 critical, 27 high, 16 moderate). After compatible updates, a clean `npm ci` and a fresh audit report **23 findings: 0 critical, 20 high, 3 moderate**. Audit totals include packages affected through their dependencies; they are not 23 independent advisories.

The remaining findings trace to three underlying advisories listed below. The audit has not been silenced or configured to hide them.

## Changes

- Updated the lockfile within the declared dependency ranges. This fixes the critical `shell-quote` finding and findings in XML parsing, brace expansion, browser metadata, HTTP caching, YAML parsing, Moment, and source-map processing.
- Retained Expo SDK 57 and React Native 0.86.3; no forced framework downgrade/major upgrade was applied.
- Scoped `uuid: 11.1.1` overrides to `xcode` and `@expo/ngrok`. Both packages use the CommonJS `uuid.v4()` API, which this patched version still supports. Compatibility tests cover iOS project ID generation and the tunnel dependency's UUID API. The real local iOS project also parsed and generated an ID successfully.

## Remaining findings

| Dependency | Cause / next step |
|---|---|
| `braces` | Used by Metro/micromatch tooling. Advisory GHSA-vfj7-8cjw-p6xm lists no patched release; the latest registry version checked was 3.0.3. Wait for a compatible upstream fix or separately evaluate replacing the tooling dependency. |
| `node-forge` | Used by Expo CLI/code-signing tooling. Advisory GHSA-86w9-cpqp-85rv affects the available 1.4.0 release. Wait for an upstream patch; do not remove/replace signing code blindly. |
| `decode-uri-component` | Used by the existing `query-string` dependency in Expo Router. The patched latest release is ESM, while the existing consumer calls its CommonJS function export. A forced override is incompatible with that API. Evaluate the supported newer Router/Expo framework combination as a separate migration. This dependency can be used in browser routing, so remaining findings are not all build-only. |

Do not run `npm audit fix --force` as a shortcut: this audit proposes downgrading Expo from SDK 57 to Expo 44 and changing other framework versions, which would break the current app's dependency alignment.

## Validation

- Clean `npm ci`: passes; reproducibly reports 23 findings.
- `npm run test:web`: 11 tests pass.
- `npm run test:security`: 2 compatibility tests pass.
- Production web export: passes.
- Android and iOS bundle exports: pass.
- Background browser check after the dependency updates: Home, Timetable, navigation, and the local assistant work without recorded runtime errors. No screen sharing was used.
- Full project TypeScript check at the time: five existing theme-property errors in a native subscription screen. That screen has since been removed; see `WEB_VALIDATION.md` for current validation.

## Render dashboard / URL findings

The latest supplied screenshot shows the old site as Live. A public HTTP check confirmed the home page at `https://campusiq-cmee.onrender.com/` returns 200. The earlier “Build not found” panel is not an application-source error and cannot be repaired by changing npm dependencies.

A direct request to `/schedule` returned 404. The manually created Render Static Site needs this dashboard rule under Redirects/Rewrites: source `/*`, destination `/index.html`, action **Rewrite**. It is already declared in `render.yaml` for Blueprint-created sites, but that file does not automatically configure a site created manually.

The new preferred service name in `render.yaml` and the deployment guide is `campusiq-web`. This requests a clean name for a new site; it does not change or reserve an existing Render hostname. Create and verify a replacement before deleting the working site.

## Advisory sources

- https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
- https://github.com/advisories/GHSA-86w9-cpqp-85rv
- https://github.com/advisories/GHSA-vcc3-ghjq-m6fr
- https://github.com/advisories/GHSA-pqg4-j6r4-53mv
