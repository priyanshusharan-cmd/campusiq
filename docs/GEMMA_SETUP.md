# Gemma setup

CampusIQ uses a Node proxy at port 8787, hosted Gemma first, and a quantized local Gemma model as fallback. See the root README for startup commands.

## Free Google API

1. Open https://aistudio.google.com/api-keys and create/select a project and key.
2. Check the project's billing/usage tier in AI Studio. Keep it on Free. Do not enable paid billing to resolve quotas.
3. Put the key only in `server/.env`, using `GEMINI_API_KEY=...`.
4. Run `npm run start:ai` and configure the server URL in app Settings.

The model is pinned to `gemma-4-26b-a4b-it`. An error or exhausted quota moves to local Gemma if allowed, never another cloud model. The app doesn't verify billing status; check it in Google's console. Free-tier data may be used to improve Google products: use sample records for public demos.

## Local fallback on your Mac

Install Ollama, start `OLLAMA_NO_CLOUD=1 ollama serve`, and download `ollama pull gemma4:e4b-it-qat`. The explicit quantized tag avoids selecting a larger hardware-specific default. Model files live in `~/.ollama/models`, outside this Git repository. No fine-tuning or training is needed.

Local inference requires enough free RAM. Close unused apps and keep prompts modest. The server uses a 4096-token context and 512-token local output cap to limit memory and waiting time. Google has a 45-second request timeout; Ollama has 90 seconds, including loading. If neither responds, the app can use deterministic calculations. Restarting Ollama may be necessary after a Mac restart; installation doesn't enable automatic login services.

## Verify both paths

- With the server URL set and both switches enabled, ask about your academic summary. Expect **Gemma API** with the hosted model ID.
- Switch **Enable Cloud AI** off, ask again, and expect **Gemma on Mac** with the local model ID. This makes no Google inference request.
- Re-enable Cloud AI and ask another question. It retries the API first.
- Attach a JPEG, PNG, or WebP image using the image button, check the preview, then send a question. The same API-first/local fallback order applies.
- Stop the model server and ask about attendance. Expect **Calculations**, a connection explanation, and an explicit statement that no model generated the result.
- Disable **Allow Local Fallback** and stop the server. The app must report the connection failure instead of generating a fallback answer.

## Connectivity

`GET /health` confirms the proxy is running and whether a key is configured, without revealing it. A configured key is not proof that it is valid or that Google has quota. `POST /api/chat` returns the actual provider/model used.

The proxy defaults to `127.0.0.1`, permits only local development browser origins, limits academic context to 32 KB and the full body to about 4.2 MB (one image up to 3 MB), caps questions at 2000 characters, handles one generation at a time, and allows ten model requests per minute. LAN binding requires an access token; set trusted browser origins explicitly with `AI_ALLOWED_ORIGINS` if needed. The Google key never goes to the app or Ollama. Browser HTTPS and native transport policies may prevent reaching a plain HTTP LAN server; public deployment needs a properly secured HTTPS backend.

This is a local development server, not a multi-user hosting service. API availability depends on internet/quota; local fallback depends on reaching the Mac. Downloading the model does not make it run on a disconnected phone.
