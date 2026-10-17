<div align="center">
<img src="assets/images/logo-transparent.png" alt="CampusIQ Logo" width="150"/>

# CampusIQ 🎓

Your campus companion for attendance, timetables, grades, assignments, and academic guidance powered by Gemma.

React Native · Expo · TypeScript · Zustand · Gemma 4 · MIT
</div>

## What it does

- Track attendance and calculate how many classes you can miss while meeting a target.
- Manage subjects, timetables, assignments, and exams.
- Forecast SGPA and track CGPA.
- Ask an assistant about saved academic data, with an optional notice or timetable image attachment.
- Keep academic records locally on your device or browser.

## Gemma: API first, local fallback

The assistant uses this fixed order:

1. **Gemma API:** `gemma-4-26b-a4b-it` through Google's Gemini API.
2. **Gemma on your Mac:** `gemma4:e4b-it-qat` through local Ollama, if fallback is enabled.
3. **Offline calculations:** clearly labeled attendance, timetable, and grade summaries if neither model is reachable and fallback is enabled.

Gemma and Gemini are different model families. The Gemini API hosts Gemma too. This app's model server only calls Gemma; there are no AWS or OpenAI fallbacks. There are no simulated model responses. Each answer identifies its source. Every new question retries the API first.

A small Node server holds the Google API key. The app sends its question and an academic summary to that server; with Cloud AI enabled, the server sends them to Google. With Cloud AI off, only local Gemma is attempted. Image attachments (JPEG/PNG/WebP, up to 3 MB) follow the same provider order; the chat shows a preview before sending. Images are held in chat memory, not persisted in academic records. Failed image requests produce an explicit error, never a calculation pretending to understand the image. Offline calculations don't send data to a model. Academic summaries currently contain subjects, recorded attendance, grades, semester, and GPA; model chat does not yet include assignment deadlines or timetable entries. The offline calculator can read the timetable. The assistant cannot modify your saved records.

Google currently lists Gemma API input/output as free, subject to quota and availability. Use an AI Studio project on the **free tier**, without enabling billing. The code cannot inspect your Google billing status or promise future pricing. Local Ollama inference has no API fees and requires a model download, disk space, memory, and a running Mac.

## Run locally

Use Node.js 22 or newer, npm, and (for local inference) [Ollama](https://ollama.com/download).

```bash
npm ci
cp server/.env.example server/.env
```

Put your Google AI Studio key in `server/.env` as `GEMINI_API_KEY`. Never put provider secrets in `EXPO_PUBLIC_*`, source files, or chat. The server config is ignored by Git.

Start the model server:

```bash
npm run start:ai
```

For the optional offline model, in separate terminals:

```bash
OLLAMA_NO_CLOUD=1 ollama serve
```

```bash
ollama pull gemma4:e4b-it-qat
```

The quantized local model is approximately 6.1 GB. It runs on the server Mac, not inside each user's phone. Quit it when unused to free memory. Ollama must be running when fallback is needed.

Start the app:

```bash
npm start
```

Or build and preview the browser app:

```bash
npm run build:web
npm run preview:web
```

Open **Settings → AI Assistant → AI Server URL**, enter `http://127.0.0.1:8787` for a browser or iOS simulator on the same Mac, and leave the token empty for the default loopback-only server. Enable Cloud AI and Allow Local Fallback for API-first behavior. Save a URL only for a server you trust with your academic summary.

For a physical phone on the same Wi-Fi, use your Mac's LAN IP instead of `localhost`. Set `AI_HOST=0.0.0.0` and a strong `AI_SERVER_TOKEN` in `server/.env`, restart the server, and enter that token in app Settings. Keep Ollama itself bound to loopback. A hosted HTTPS browser cannot generally call a Mac's HTTP backend; use the local browser preview for this setup. Native HTTP LAN access may require platform-specific development transport settings; test your installed build on your phone. Do not expose this development server publicly.

See [Gemma setup and verification](docs/GEMMA_SETUP.md) for diagnostics and [browser deployment](docs/RENDER_DEPLOYMENT.md) for the optional static demo. A static deployment alone does not run the model server. Without a configured reachable server, the app retains labeled offline calculations.

## Checks

```bash
npx tsc --noEmit
npm run test:ai
npm run test:web
npm run test:layout
npm run test:security
npm run build:web
```

AI tests mock providers to verify API priority, quota/timeout fallback, local-only privacy, disabled fallback, honest labeling, authentication, CORS, and input limits. No paid inference is used by the automated tests.

## Contributing and license

Contributions are welcome: open an issue or submit a pull request with a focused change and validation notes. CampusIQ is licensed under [MIT](LICENSE). Gemma model weights are distributed separately under their own terms.

Model references: [Gemma via Gemini API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api), [pricing](https://ai.google.dev/gemini-api/docs/pricing#gemma-4), [Gemma with Ollama](https://ai.google.dev/gemma/docs/integrations/ollama).
