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

The full project TypeScript check (`npx tsc --noEmit`) reports the same five pre-existing theme-property errors in `src/app/(modals)/paywall.tsx` as before this work: `background`, `text`, and `textMuted` are not valid theme properties. That native file is unchanged. The browser uses `paywall.web.tsx`, and no new TypeScript diagnostics were introduced.

Build success is not a substitute for testing the installed Android/iOS app on physical devices. Native adapters re-export the existing APIs, and native AI, notifications, storage, and purchase behavior remain in their original implementations.

The web demo uses browser-local storage and a deterministic local assistant. Cloud AI, cross-device sync, scheduled background phone notifications, biometric app locks, and app-store purchases are not implemented for the static website. Browser settings explain unavailable phone capabilities. PDF saving depends on the browser's print support.

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
