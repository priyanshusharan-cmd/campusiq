<div align="center">
<img src="assets/images/logo-transparent.png" alt="CampusIQ Logo" width="150"/>

# CampusIQ 🎓

Your campus companion for attendance, timetables, grades, assignments, and academic guidance powered by Gemma.

React Native · Expo · TypeScript · Zustand · Gemma 4 · MIT
</div>

## Features

Track attendance, calculate attendance targets, manage subjects and deadlines, view your timetable, forecast SGPA, and track CGPA. Ask Gemma about your academic summary or attach a college notice/timetable image.

## How AI works

**Your phone → Google directly**, using `gemma-4-26b-a4b-it` through the Gemini API. Your Mac can be off. No CampusIQ backend is required.

If Google is unavailable and **Allow Local Fallback** is enabled, the phone calls **Ollama on your Mac directly**, using the downloaded `gemma4:e4b-it-qat`. Your Mac computes the answer and sends it to the phone. Choose **My Mac only** to use the Mac manually. Both the Ollama desktop app and CLI provide the same model API.

Text-only questions can use clearly labeled offline calculations if neither model is reachable and Basic offline help is enabled. Images never receive a fabricated calculation-based answer. Every model answer identifies its provider, and every new cloud-enabled question retries Google first. No paid-provider fallbacks or simulated model responses exist.

The assistant receives subjects, recorded attendance, grades, semester, and GPA. Timetables and assignment deadlines are not yet included in model context; the offline calculator can read the timetable. Both cloud and local Gemma can prepare subjects and weekly classes from a timetable image: attach it and ask “Add the subjects and update my timetable in the app.” Open **Review app changes**, check the semester, subjects and times, then **Confirm and save**. Enable **Replace weekly timetable** when replacing an existing schedule. Unclear details need correction before saving; exact duplicates are skipped. Basic offline help cannot read images or prepare imports. Images are JPEG/PNG/WebP, up to 3 MB, with preview/removal before sending. Chat images are not saved to academic records.

## iPhone setup

1. Install dependencies with `npm ci` and run `npm start`, or build a new native iPhone version. The latest native version needs Expo SecureStore and local-network permissions; an older installed binary must be rebuilt.
2. In **Settings → AI Assistant → Google AI Studio API Key**, enter your own free-tier Google key. It is stored in the iPhone Keychain through Expo SecureStore, not in source, exported bundles, or regular settings storage.
3. Choose **Automatic** or **Google only** under Answer preference. The phone connects directly to Google over its own internet connection.
4. Optionally configure the **Mac Ollama URL**, such as `http://192.168.1.52:11434`, and choose **Automatic**. Use your Mac's actual current Wi-Fi IP, not `localhost`, on the phone.

Your Google key must belong to a project kept on Google's free tier. Gemma input/output is currently listed as free, subject to quota and availability. The app cannot inspect your Google billing tier or guarantee future pricing. Do not enable paid billing to resolve quota exhaustion.

Each installation uses its owner's key. Never embed a shared developer key in a public app build. Google receives cloud questions, academic summaries, and attached images; free-tier content may be used to improve Google products. Local requests go only to your Mac.

## Optional Mac fallback

Install the official [Ollama desktop app](https://ollama.com/download), or use the Ollama CLI. Download the local model once:

```bash
ollama pull gemma4:e4b-it-qat
```

For the desktop app, configure its local-network listener from Terminal, replacing the example with your Mac's actual Wi-Fi address, then quit/reopen Ollama:

```bash
launchctl setenv OLLAMA_HOST '192.168.1.52:11434'
launchctl setenv OLLAMA_NO_CLOUD '1'
```

Alternatively, quit the desktop app and run the CLI listener:

```bash
OLLAMA_HOST=192.168.1.52:11434 OLLAMA_NO_CLOUD=1 ollama serve
```

Use one listener at a time. Your Mac must be awake and reachable, and Ollama must be running. The phone and Mac can communicate over the same Wi-Fi without internet. Guest Wi-Fi isolation or a firewall can block the connection. Allow local-network access when iOS asks. Ollama's API has no built-in authentication; use only your trusted private network and do not publish its port to the internet. If the Wi-Fi IP changes, update both the listener and phone setting.

The desktop app and CLI share model files. On this development Mac, **Ollama.app is in `/Applications`** and the 6.1 GB Gemma model lives in **`~/Documents/CampusIQ-Gemma/models`**, linked from `~/.ollama/models`. Quit Ollama before deleting the model folder. No retraining or second download is required.

See [Gemma setup and verification](docs/GEMMA_SETUP.md) for details.

## Browser demo

```bash
npm run build:web
npm run preview:web
```

The browser uses the same direct Google/local Ollama routing. A browser API key is held only in module memory and cleared by a page reload; it is never persisted in browser storage. Set it in Settings after each reload. Native iPhone keys remain securely stored between launches.

A hosted HTTPS browser may block HTTP calls to a local Mac. Use the local browser preview or the native phone app for local fallback. See the [static deployment guide](docs/RENDER_DEPLOYMENT.md).

## Validation

```bash
npx tsc --noEmit
npm run test:ai
npm run test:web
npm run test:layout
npm run test:security
npm run build:web
```

AI tests use mocked providers without consuming Google quota. They verify direct Google access with no Mac configured, fallback, local-only mode, disabled fallback, images, credential isolation, secure storage, and settings migration.

## Contributing and license

Contributions are welcome through focused issues and pull requests. CampusIQ is licensed under [MIT](LICENSE). Gemma model weights are distributed separately under their own terms.

References: [Gemma API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api), [pricing](https://ai.google.dev/gemini-api/docs/pricing#gemma-4), [Ollama networking](https://docs.ollama.com/faq), [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/).

AI settings include guided Google/Mac setup cards, explicit connection checks, expandable explanations, and a separate Basic offline help switch. The Google test sends one short generic prompt; the Mac check only reads installed models. In chat, use **+ → Add image** to select a photo and review its removable thumbnail inside the composer before sending.

AI app changes are off by default in each chat. Tap the top-right **lightning button**, read the explanation, and tap **Okay** to enable them; tap it again to turn them off. The attachment menu contains only photo selection; keyboard image paste is handled by the message input. Browser image paste is handled directly in the composer. With lightning mode enabled, the model interprets each message using conversation context; exact command phrases are not required. AI can make mistakes, so review the affected records before confirming. Both Google Gemma and local Ollama use the same action planner.

Supported edits include weekly class rescheduling, extra dated classes, cancelling/rescheduling one occurrence, attendance for a class/day/date range or month (present, absent, cancelled, holiday, or clear explicit records), subject details, semester results, assignment completion/deadlines/priority, exam edits, calendar holidays/exam days, academic profile fields, and common appearance/attendance/GPA-goal preferences. Bulk attendance expands saved schedules and shows each affected class, skipping calendar holidays/exam days and dates outside semester bounds. Saved data changing during review requires reopening the review. Notifications, exports/sharing, credentials/security, custom grading configuration and app-wide resets remain outside chat control. Subjects with results must have those results removed in the academic screen before deletion.

On iPhone, use the keyboard’s photo paste suggestion to attach a copied image directly to the composer, or **+ → Choose photo** for the photo library. Keyboard image paste uses the native `expo-paste-input` module and requires a rebuilt app; it cannot be added to Expo Go by reloading JavaScript. Existing custom builds without that module retain photo-library upload. Pasting adds a preview and never sends automatically. No custom paste chip, paste menu entry or background clipboard polling is used.

Conversation context is shared by normal chat and AI app changes across Google and local Ollama. Each request carries bounded recent user/assistant turns and the latest user-shared image once, so follow-ups such as asking for faculty from an earlier timetable do not require attaching it again while that chat remains open. Sending a replacement image supersedes the earlier image. Pending/error messages are excluded from model context.

Closing or navigating away from AI chat aborts its active cloud/local transport, cancels response reading and prevents fallback or late replies. Local requests always stream, including JSON action preparation, so disconnecting can cancel the Ollama generation. This does not stop the Ollama application or unload its cached model. Google server errors get at most one retry (a structured retry omits JSON MIME enforcement but app-side validation remains required). Google-only mode never contacts your Mac; choose Automatic for local fallback. Settings labels a successful check as a short text test, not a guarantee that a later image/import request will succeed. Opening Settings no longer sends a Google test automatically.
