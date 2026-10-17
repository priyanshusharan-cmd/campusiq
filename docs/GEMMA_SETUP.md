# Gemma setup: direct Google, optional Mac

There is no CampusIQ model backend. Google calls originate on the phone; local fallback calls go directly to Ollama on the Mac. See the README for startup and network settings.

## Google API key

Create/select a key at https://aistudio.google.com/api-keys using a project on the Free tier. Enter it once in the native app's Settings. Expo SecureStore saves it to the iOS Keychain/Android encrypted storage. No developer key is compiled into the app. The current model is pinned to `gemma-4-26b-a4b-it`; the Google key is sent only to Google's HTTPS endpoint.

The old proxy is removed. Its development key was preserved in the ignored root `.env` under `GEMINI_API_KEY`, not an `EXPO_PUBLIC_*` variable. It is not automatically transferred to the phone; enter your own key locally. Do not paste it into chat or publish it. Browser keys are session-memory only and clear on reload. Saving an empty key removes it. Deleting app data through Settings removes the key too.

## Ollama desktop app and CLI

Both serve the same HTTP API. On this Mac the official app is `/Applications/Ollama.app`, while the Homebrew CLI remains available as `ollama`. Use only one listener at a time. The model is `gemma4:e4b-it-qat`, approximately 6.1 GB. Its files are in `~/Documents/CampusIQ-Gemma/models`; `~/.ollama/models` is a directory symlink pointing there. The app and CLI reuse this model.

To use the phone, configure the desktop app's `OLLAMA_HOST` to the Mac's Wi-Fi address, quit/reopen Ollama, and use that same URL in phone Settings. This Mac's address during setup was `192.168.1.52`. `localhost` on an iPhone refers to the iPhone, not your Mac. Keep `OLLAMA_NO_CLOUD=1` for Ollama. Your phone and Mac must be on the same trusted Wi-Fi, the Mac must be awake, and the local network must allow device-to-device connections. iOS local-network access and Mac firewall permission may need approval on your devices. No internet is needed for this local path.

The app requests a 4096-token local context and up to 512 output tokens. Cloud requests time out after 45 seconds; local requests after 90 seconds. No repeated background inference or automatic paid retries occur.

## Verify routing

1. Add a Google key, select Automatic or Google only, and leave the Mac URL blank. A successful answer shows **Gemma API**, proving no Mac dependency.
2. Set the optional Mac URL and select My Mac only. Expect **Gemma on Mac**, including for image questions.
3. Re-select Automatic or Google only. The next question tries Google first again.
4. With no reachable provider, text questions can get **Calculations** when fallback is allowed. Image questions get an explicit error.
5. With Google only selected, the Mac is not contacted. Basic offline help independently controls whether failed text requests receive deterministic calculations.

Existing real hosted inference and local image inference were verified before the routing change. The new direct routing and image serialization are covered by automated mocked tests; physical-iPhone network and permission testing is still needed. No new Google requests or UI screen sharing were used for this change.

## Native builds

Rebuild installed native versions for Expo SecureStore and local-network transport configuration. iOS gets a local-network explanation and ATS local-network support. Android permits cleartext transport for the local Ollama endpoint; app URL validation accepts HTTP only for loopback/private network hosts. Google always uses HTTPS. Do not expose Ollama to the public internet: it has no built-in API authentication.

## Remove after the hackathon

Quit Ollama. Delete `~/Documents/CampusIQ-Gemma` to remove downloaded weights. Remove the `~/.ollama/models` symlink if it remains broken. Remove `/Applications/Ollama.app` if no longer needed. The Homebrew CLI is a separate installation; `brew uninstall ollama` removes it. `launchctl unsetenv OLLAMA_HOST` and `launchctl unsetenv OLLAMA_NO_CLOUD` clear the app listener settings. These operations don't delete CampusIQ academic records.

## Guided settings

Answer preference selects Automatic, Google only, or My Mac only in one step. Google key and Mac address setup live in separate cards. A saved credential/address does not appear as verified until its check succeeds. Google checks use a short synthetic prompt with no academic records. Mac checks read `/api/tags` and confirm the expected model is installed, without running inference. Connection results describe the last check, not continuous monitoring. The address field accepts a bare Wi-Fi IP and adds HTTP/port 11434. Advanced connection and data-sharing explanations expand on demand.

Basic offline help is separate from provider selection. Existing preferences migrate without deleting academic data.

## Response progress and streaming

Chat shows a preparation message before the first answer text, then updates the same answer as chunks arrive. Google uses `streamGenerateContent?alt=sse`; Ollama uses `/api/chat` with `stream: true`. Native builds use `expo/fetch` for response-body streaming. These status labels describe the request state, not the model's internal reasoning; thought fields remain excluded.

A provider switch clears any unfinished answer before displaying the backup response. Interrupted streams require a completion marker and are never presented as a successful complete answer. Stream tests use mocked providers; a small local Ollama smoke test can verify chunks without Google quota.

References: [Google streaming API](https://ai.google.dev/api/generate-content#method:-models.streamgeneratecontent), [Ollama streaming](https://docs.ollama.com/api/streaming).

## Personalization with saved records

Every model request includes the current saved academic snapshot as optional reference context, including greetings, general questions, and images. The prompt tells Gemma to use only facts relevant to the latest question and to answer normally without mentioning irrelevant records. Greetings should receive a brief greeting; a full academic summary is requested only when the student asks for one. Image extraction must use the image, with saved-data comparisons only when requested. There is no keyword gate or canned greeting response.

Context contains the current semester name, SGPA, CGPA, subject names and credits, grades, and attendance counts, percentages and targets. It is enclosed in `saved_academic_facts_reference_only` markers and treated as data, never instructions. Saved records remain in the app; this is request-time personalization, not model training or persistent provider memory. The request does not include microphone recordings or prior chat messages. The provider handling the request receives the saved academic snapshot each time.
