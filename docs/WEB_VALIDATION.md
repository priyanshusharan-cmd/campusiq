# Browser demo validation

Verified locally on 16 October 2026. Render has not yet been provisioned by this change.

## Passed

- Production web export: `npm run build:web`.
- Android and iOS JavaScript/Hermes exports after the adapter and navigation changes.
- 11 automated adapter tests: `npm run test:web`.
- ESLint for the new platform adapters and browser-specific components/services.
- `git diff --check`.
- Public web bundle contains none of the native AWS Bedrock, Gemini, or OpenAI provider endpoints, nor the AWS public-secret variable reference.

## Browser checks (background, without screen sharing)

At 390 × 844, verified:

- Fresh demo entry and sample-data launch.
- Fresh-profile onboarding end to end, including browser date selection.
- Class form validation, subject/day selection, browser time selection, saving, and persistence after reload.
- Attendance calendar status edits, updated totals, and persistence after reload.
- Assignment creation and appearance in the saved list.
- GPA forecast mark editing, saving, and reopening the saved value.
- Assistant attendance responses, matching tracker counts and the configured target, with clear local-demo labeling.
- Direct-link navigation and the Back fallback to Home.
- Appearance action menu and selecting Light Mode.
- Profile, exams, GPA, analytics, settings, and timetable rendering.
- Subjects JSON download and re-import parsing up to its confirmation dialog (cancelled to preserve the test dataset).
- No runtime errors recorded during the checked browser flows.

Also checked document-width overflow at 320 × 740 (GPA), 390 × 844 (main screens), and 1440 × 900 (analytics); none was present.

The browser print adapter is covered by automated tests for sandboxed report content and invoking the print flow. Saving an actual PDF and OS share-sheet behavior still need a physical-browser check; no automated claim of full PDF parity is made.

## Existing issues and practical limits

The native subscription screens have since been removed. See the current cleanup validation below for updated TypeScript results.

Build success is not a substitute for testing the installed Android/iOS app on physical devices. Native adapters re-export the existing APIs, and native AI, notifications, and storage behavior remain in their original implementations.

The web demo uses browser-local storage and a deterministic local assistant. Cloud AI, cross-device sync, scheduled background phone notifications, and biometric app locks are not implemented for the static website. Browser settings explain unavailable phone capabilities. This historical check predates the optional Gemma proxy; see GEMMA_SETUP.md for current AI configuration. PDF saving depends on the browser's print support.

Use the final checklist in `docs/RENDER_DEPLOYMENT.md` on the deployed HTTPS URL and on your actual phone before sharing it publicly.

## Mobile design alignment update

The browser-only marketing/welcome page has been removed. The root route now opens the existing mobile onboarding or Home screen. The optional `/?demo=1` link loads sample data straight into the same Home UI. Existing visitor data is retained.

- The app frame is 430 px wide on desktop and fills narrower phone screens, preserving mobile card, tab, menu, and typography proportions.
- Closed drawer contents are not mounted, and the app frame clips off-screen drawer movement. The menu opens over the app, rather than leaking into a desktop sidebar.
- Browser screen measurements use the app-frame width for charts, sliders, and other dimension-based layouts. Native measurements re-export React Native's original APIs.
- The assistant uses the mobile circular 60 px sparkle control, with browser pointer dragging and keyboard activation.
- Modal portals stay within the same phone-width bounds on desktop.
- Settings reuses the existing mobile card/row layout. Browser-unavailable cloud configuration explains its limitation when selected, without collecting provider keys. Phone-specific capability limits are unchanged.

Background DOM checks (no screen sharing) verified native onboarding at the root, Home with sample data, drawer open/close, assistant activation, and modal bounds. Measured the app frame at 430 px in a 1440 px desktop viewport and 390 px in a 390 px phone viewport. No web marketing card or closed drawer menu remained in the rendered page.

`npm run test:layout` adds three regression tests for viewport sizing and closed/open drawer rendering. The Android and iOS drawer implementations remain re-exports of the original library; the mobile onboarding, Home, and feature screen designs are shared with the browser.


## Cleanup validation — 17 October 2026

The billing SDK, initialization adapters, subscription routes, and paid-access checks have been removed. The native floating assistant button now opens Campus AI directly. Existing academic data and AI provider configuration are retained.

- `npx tsc --noEmit`: passes.
- ESLint for all modified TypeScript files: passes.
- `npm run test:web`, `npm run test:layout`, and `npm run test:security`: all 16 tests pass.
- Production web export and Android/iOS JavaScript/Hermes exports: pass.
- Installed native builds must be rebuilt to remove the old native SDK. Physical-device navigation has not been tested during this cleanup.


## Gemma integration — 17 October 2026

The shared assistant now connects to a separate model server: hosted Gemma first, local Ollama second, and labeled deterministic calculations last. Google credentials stay in the ignored server config. Browser settings support a server URL and access token; Cloud AI can be disabled for local-only requests. Legacy client-provider settings are discarded by a preference-preserving migration.

- Real hosted Gemma responses verified through the proxy with synthetic data and in browser chat.
- Image request routing, payload validation, and failure labeling verified with mocked models; no private image was uploaded for testing.
- Downloaded local `gemma4:e4b-it-qat` (6.1 GB). With cloud disabled, real local image inference through the proxy identified a generated red PNG correctly in about ten seconds.
- `npm run test:ai`: 19 tests pass. The existing web/layout/security suites add 16 passing tests.
- TypeScript and ESLint for changed source files pass. Web and native bundle exports pass.
- No provider API key found in the exported web, Android, or iOS bundles.
- Browser interaction stopped at the user's request before image-picker UI testing; installed-phone testing remains outstanding.


## Direct phone routing update — 17 October 2026

This supersedes the proxy architecture described in the historical validation above. The Node model server has been removed. The native phone calls Google directly with a user-provided SecureStore key and calls Ollama on the Mac only as fallback or in local-only mode. The browser uses the same routing, with a memory-only key. Old proxy settings are removed by a preference-preserving migration.

Ollama.app is installed in Applications. The model was moved to Documents/CampusIQ-Gemma/models and linked from the default Ollama model directory. The desktop app is configured for the current Mac Wi-Fi IP with Ollama cloud features disabled. Physical-iPhone connectivity and system-permission prompts remain untested. Browser automation remains stopped at the user's request.

- Updated routing/storage tests: all 14 AI tests pass; all 16 existing web/layout/security tests pass (30 total).
- TypeScript, changed-source ESLint, and web/Android/iOS bundle exports pass. The private Google key is absent from all three exports.
- No live Google request was made for this routing change.
