# CampusIQ browser demo on Render

Choose **Static Site**. This demo does not need a Web Service, database, login provider, or AI API keys.

## What is included

- A mobile-friendly entry page with “Try with sample data” and an empty-profile option.
- The existing attendance, timetable, subjects, assignments, exams, grade tracker, forecaster, analytics, and profile screens.
- Browser date/time inputs, working confirmation/action dialogs, and browser-local persistence.
- JSON subjects/timetable exports as downloads; local JSON imports through the file picker.
- Report export through the browser print menu: choose Save as PDF where the browser supports it.
- A clearly labeled local demo assistant for attendance, timetable, and grade summaries.

The public demo does not provide cloud AI, app-store billing, biometric locks, scheduled background notifications, or cloud sync. These require mobile APIs or additional hosted services. Every visitor has their own browser storage; clearing site data removes it. Private browsing/storage restrictions may limit persistence.

## 1. Put the changes on GitHub

Render builds the committed GitHub version, not your local files. The prepared deployment branch is `codex/render-web-demo`. Push this branch if it is not already on GitHub. Do not upload `.env`, `node_modules`, `dist`, or personal credentials. The repository already ignores these paths.

## 2. Create the Static Site manually

1. Sign in at https://dashboard.render.com/.
2. Click **New**, then **Static Site**.
3. Connect your GitHub account if needed and select `priyanshusharan-cmd/campusiq`.
4. Select **`codex/render-web-demo`** as the branch. This keeps deployment separate from your mobile branch.
5. Enter these settings:

| Field | Value |
|---|---|
| Name | `campusiq-demo` (or any available name) |
| Root Directory | Leave blank |
| Build Command | `npm ci && npm run build:web` |
| Publish Directory | `dist` |

6. Add environment variable `NODE_VERSION` with value `22.16.0`.
7. Leave AI/AWS environment variables empty. No credentials are required. The web build also explicitly disables `.env` loading and public-variable substitution.
8. Click **Create Static Site** and wait for the deploy to finish.

## 3. Add the page-refresh rule

In the site's **Redirects/Rewrites** settings, add:

| Field | Value |
|---|---|
| Source Path | `/*` |
| Destination Path | `/index.html` |
| Action | **Rewrite** |

Save the rule. This lets a direct link or refresh on `/schedule`, `/attendance`, or a subject-detail page load the application. Render serves existing assets before this fallback. Use **Rewrite**, not Redirect.

## Alternative: Blueprint setup

The included `render.yaml` declares the same Static Site, build settings, Node version, and rewrite. After pushing it to GitHub, choose **New → Blueprint**, connect this repository, select the branch, review the single Static Site, and apply it. The manual steps above are sufficient; do not create a second service if you use the Blueprint instead.

## 4. Verify the published URL before posting

1. Open the Render-provided HTTPS URL in a fresh/private browser tab.
2. Select **Try with sample data**. You should see Alex's sample semester.
3. Open Timetable, Attendance, GPA, assignments, exams, and analytics.
4. Create a subject or class and refresh; verify it remains saved in a normal browser tab.
5. Open `/schedule` directly and refresh to confirm the rewrite works.
6. Open the assistant and ask “How many classes can I skip?” It should display its local-demo label and attendance calculations.
7. Try a JSON export and a report export. On supported browsers the report opens the print/Save as PDF flow.
8. Check the link on your actual Android/iPhone browser as well. Desktop viewport testing cannot prove every physical-device browser behavior.

You can then put the Render URL in your LinkedIn post as “Try CampusIQ in your browser”. Future pushes to the configured branch can redeploy the demo.

## Local preview

```sh
npm ci
npm run test:web
npm run build:web
npm run preview:web
```

Open http://localhost:4173/. The preview serves the production build with the same single-page fallback used on Render. Stop it with Ctrl+C.

## How mobile behavior is preserved

Browser adapters use `.web.ts` / `.web.tsx` files. Their native counterparts re-export the existing native APIs. Existing mobile cloud AI, local storage, notification logic, purchases, and biometric functionality remain in their native implementations. Shared edits route imports through these adapters, enable web picker buttons, add accessible form labels, and choose the browser-only layout/demo notices. No native dependency versions were changed.

## References

- https://render.com/docs/static-sites
- https://render.com/docs/deploy-create-react-app#using-client-side-routing
- https://docs.expo.dev/guides/publishing-websites/
- https://docs.expo.dev/guides/environment-variables/#security-considerations
