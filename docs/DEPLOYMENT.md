# Deploying the CampusIQ web app

The web app is hosted on **GitHub Pages** at **<https://priyanshusharan-cmd.github.io/campusiq/>**.

It is a static build: GitHub only serves HTML, JavaScript and images. There is no server, no database and no bundled API key. Each visitor's records stay in their own browser storage, and AI requests go directly from the browser to the provider the visitor configures.

## How it deploys

Every push to `main` runs the [Deploy web app](../.github/workflows/pages.yml) workflow:

1. `npm ci`
2. Sets the Expo web base path to `/campusiq` (only inside the CI build; `app.json` in the repo is unchanged)
3. `npm run build:web` → `dist/`
4. Copies `index.html` to `404.html`, so refreshing any in-app page (e.g. `/campusiq/schedule`) still loads the app
5. Uploads `dist/` and deploys it to the **CampusIQ** environment

The repository sidebar shows the latest run under **Deployments → CampusIQ**. You can also start a deploy manually from **Actions → Deploy web app → Run workflow**.

## One-time setup

**Settings → Pages → Build and deployment → Source: GitHub Actions.**

## Releases

Native apps are built separately by the [Release](../.github/workflows/release.yml) workflow (**Actions → Release → Run workflow**), which publishes the Android APK, the unsigned iOS IPA and a `web.zip` to a GitHub Release.

## Self-hosting the web build

Any static host works. Unzip `CampusIQ-<version>-web.zip` from a release and serve it at the site root, with a fallback that sends unknown paths to `/index.html`. To serve it from a sub-path, build it yourself with `experiments.baseUrl` set to that path in `app.json`.

## Checklist after a deploy

- The home page loads at the Pages URL.
- Refreshing `/campusiq/schedule` still loads the app.
- Adding a record survives a reload (browser storage).
- An optional Google key connection test works in **Settings → AI Assistant**.
- No API key is visible in the page source.
