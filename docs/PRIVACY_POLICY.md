<a id="top"></a>

# CampusIQ Privacy Policy

**Last updated: 15 November 2026**

This is the same policy shown in the app under **More → Privacy Policy**.

## At a glance

| | |
| :--- | :--- |
| 🙅 **No account** | CampusIQ has no sign-up, login or user accounts. |
| 🖥️ **No CampusIQ servers** | There is no backend, database, analytics or tracking service. |
| 📱 **Stays on your device** | Timetable, attendance, grades and settings live in app or browser storage. |
| 🧮 **Math runs locally** | Attendance and GPA calculations never need the internet. |
| ✈️ **AI is opt-in** | Only when you use AI does data go to the provider **you** chose (Google or your own Ollama machine). |
| 🔑 **Bring your own key** | No API key is bundled. Native apps keep your key in secure storage; the web keeps it in memory only. |
| 🚫 **No ads** | No advertising or data-broker trackers. |

## Contents

1. [Scope of this policy](#1-scope-of-this-policy)
2. [Information you choose to add](#2-information-you-choose-to-add)
3. [Device storage and offline use](#3-device-storage-and-offline-use)
4. [What is sent when you use AI](#4-what-is-sent-when-you-use-ai)
5. [Google cloud processing](#5-google-cloud-processing)
6. [Gemma Local and your Mac](#6-gemma-local-and-your-mac)
7. [Automatic routing and connection checks](#7-automatic-routing-and-connection-checks)
8. [Uploaded images and clipboard content](#8-uploaded-images-and-clipboard-content)
9. [AI review and your control](#9-ai-review-and-your-control)
10. [Conversation lifetime and cancellation](#10-conversation-lifetime-and-cancellation)
11. [API keys and connection settings](#11-api-keys-and-connection-settings)
12. [Permissions and device services](#12-permissions-and-device-services)
13. [Exports, backups and external destinations](#13-exports-backups-and-external-destinations)
14. [Retention and deletion](#14-retention-and-deletion)
15. [Service limits and third-party links](#15-service-limits-and-third-party-links)
16. [Updates and privacy questions](#16-updates-and-privacy-questions)

---

## 1. Scope of this policy

This policy explains the data handled by the current CampusIQ app, including its mobile experience, browser version and optional AI connections. CampusIQ has no backend: there is no CampusIQ server, account, database or analytics service. It describes how features work today rather than promising that every optional feature is offline. Last updated: 15 November 2026.

CampusIQ is developed by Priyanshu Sharan. It is a student planning tool, not an official college record system. The information you enter may include details about you, your courses and your faculty. Only include information you have permission to use.

## 2. Information you choose to add

Profile information can include your name, student identifier, college, branch, semester, semester dates and profile image. Academic records can include subject names and codes, faculty, credits, course types, rooms, timetable entries, attendance, assessment marks, grade points, semester results, assignments, exams and notes.

The app also saves preferences such as appearance, attendance targets, college timings, grading configuration, notification choices and AI connection settings. You control the content of these records through the relevant app screens.

## 3. Device storage and offline use

Core records are persisted in app storage on your device. The browser version uses storage associated with the site and browser profile. Attendance calculations, grade calculations and ordinary record editing do not require a remote AI request.

General academic records are not stored in the same secure credential store as native API keys. Device access controls, browser profiles, operating-system backups and shared-device access can affect their privacy. CampusIQ does not promise that all stored records are encrypted or recoverable after data loss.

## 4. What is sent when you use AI

An AI request can include your message, recent conversation turns, the source image associated with the conversation and an academic summary. The summary can include subjects, attendance counts and targets, grades, semester totals and GPA information.

When AI app changes are enabled, the request can additionally include relevant saved app state so the assistant can identify records to update. This can include subject details, class slots, tasks, exams, calendar events and supported profile or preference fields. Turning off app modifications does not turn ordinary AI chat into an offline feature; chat still uses the selected provider.

## 5. Google cloud processing

In cloud mode, CampusIQ sends requests directly to Google’s generative-language API using the configured API key. Google processes the supplied text, images and context under its own terms and privacy policy. CampusIQ does not provide a separate CampusIQ cloud account or synchronization backend for those records in this version.

Google’s handling of submitted content depends on the applicable service and account terms, including whether usage is paid or unpaid. Free-tier terms may allow content to be used for product improvement and human review. Do not upload sensitive records without checking the terms linked below. Removing an item in CampusIQ does not delete copies already processed by a provider.

## 6. Gemma Local and your Mac

The Local option connects to an Ollama endpoint, commonly running on your Mac. Local means the selected inference endpoint, not necessarily processing on the iPhone itself. Messages, selected images and context travel from the app to that configured machine.

The machine’s owner and its software control processing, logs and retention. Depending on the address configured, this connection may use an unencrypted local HTTP connection. Use an endpoint and network you trust. If you configure a remote address, the destination may be outside your local network.

## 7. Automatic routing and connection checks

Automatic mode can attempt cloud processing and then use a configured local fallback when available. A cloud-only selection does not require a Mac; a local selection needs the configured endpoint to be reachable. Review the selected mode before sending private content.

A Google connection test sends a small test request and may consume provider quota. A local connection check reads the endpoint’s available models. A successful text test does not guarantee that a later image or app-change request will succeed.

## 8. Uploaded images and clipboard content

You can attach images through the photo picker and supported paste or drop actions. An attached timetable or marksheet may contain names, student identifiers, signatures, room information and grades. Crop or cover unrelated information before sending it to AI.

The conversation may reuse its most recent source image when you ask a follow-up question. Selecting a new image changes the active source for later questions. The chat screen does not need a background clipboard monitor; pasting or selecting an image is an action you initiate. Temporary image files may remain in app or operating-system caches.

## 9. AI review and your control

The lightning control enables the assistant to prepare supported changes. It does not give the model unrestricted access to the device or permission to save every suggestion. Proposed changes are presented for review, and saving requires confirmation.

The review may show suggested lab mappings, missing fields, duplicate records or timetable conflicts. You can edit or remove proposed rows. Replacement affects the selected semester and the scope shown in the review. AI can misread merged cells, section labels, batches, credits or faculty, so check the result against the original document.

## 10. Conversation lifetime and cancellation

The current chat uses recent messages and a source image to answer follow-ups. This conversation state is held by the chat screen rather than offered as a permanent synchronized chat archive. Closing the chat cancels the app’s active request and stops accepting late updates.

Cancellation does not guarantee that an external service immediately stops processing, removes a submitted request or reverses quota usage. The app may use one additional correction request to repair a defective action proposal before review. Provider-side copies remain subject to the destination’s rules.

## 11. API keys and connection settings

On supported native builds, a user-saved Google API key is held using the operating system’s secure storage. The browser implementation holds a user-entered key in memory for the current page session. CampusIQ is bring-your-own-key only: no key is bundled into the app, the web build or any release.

Clearing a saved key removes it from the app; it does not revoke the key with Google. Never include keys in screenshots, chat messages, exported records or a public build. Manage revocation and restrictions with the provider that issued the key.

## 12. Permissions and device services

Features can use the system photo or document picker, local-network access, notifications, sharing and device authentication where supported. Availability and prompts vary between platforms. System pickers let you choose the file or image you intend to use.

If you enable device authentication, the operating system performs authentication; CampusIQ does not receive your fingerprint or face template. Notification previews and shared files may reveal academic information to someone with access to your screen or destination. You can manage system permissions in device settings.

## 13. Exports, backups and external destinations

When you export or share records, a file or report is created and passed to the destination you choose. The receiving application, person or storage service then controls its copy. Such copies are not automatically updated when you edit or delete the original record.

Keep backups somewhere you trust and review a file before sharing it. Browser downloads, operating-system backups, photo libraries, clipboard managers and files copied to another device can outlive the CampusIQ record that created them.

## 14. Retention and deletion

Saved academic records remain in app or browser storage until you change them, remove them or clear the app’s data. Some deletion actions also remove linked academic records, as described in the app’s confirmation dialog.

The Settings deletion flow clears the main local stores, profile, preferences and user-saved Google key, then returns to onboarding. It does not revoke provider credentials or erase provider logs, exported files, original photos, backups or another device’s copies. Clearing browser site data or uninstalling an app can remove local records without providing a recovery option.

## 15. Service limits and third-party links

The current implementation is not an advertising or data-broker service and does not add an advertising tracker to the academic workflow. Network services you choose, web hosting infrastructure and development tools may have their own operational logging. This policy does not claim that third-party systems collect no technical information.

External policy links open outside CampusIQ. Feature availability, network behavior and provider policies can change independently of this page.

## 16. Updates and privacy questions

We will revise this page as the app’s data flows change. Check the last-updated date when deciding whether to use an optional connection. Important choices should be based on the current app controls and the current terms of the selected destination.

For questions about the app’s behavior, open an issue on the CampusIQ GitHub repository. Do not send credentials or a full marksheet in an initial support message; share only the minimum information needed to explain the issue.

---

## External policies

- [Google Privacy Policy](https://policies.google.com/privacy)
- [Google AI API terms and data use](https://ai.google.dev/gemini-api/terms)

## Contact

Questions about privacy: [open an issue](https://github.com/priyanshusharan-cmd/campusiq/issues). Don’t include API keys, full marksheets or student IDs.

<div align="center">

[↑ Back to top](#top)

</div>
