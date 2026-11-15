<a id="top"></a>

<div align="center">

<img src="../assets/images/logo-transparent.png" alt="CampusIQ logo" width="96" />

# CampusIQ User Manual

**Everything you need to set up CampusIQ, run your semester with it and get the most out of Gemma AI.**

![Version](https://img.shields.io/badge/app-v1.0.0-7C5CFC?style=flat-square)
![Platforms](https://img.shields.io/badge/iOS_·_Android_·_Web-10B981?style=flat-square)
![Backend](https://img.shields.io/badge/backend-none-F59E0B?style=flat-square)

</div>

---

## Contents

1. [Before you start](#1-before-you-start)
2. [Installing CampusIQ](#2-installing-campusiq)
3. [First launch and onboarding](#3-first-launch-and-onboarding)
4. [Finding your way around](#4-finding-your-way-around)
5. [Subjects](#5-subjects)
6. [Timetable and classes](#6-timetable-and-classes)
7. [Attendance](#7-attendance)
8. [Grades: SGPA, CGPA and scorecards](#8-grades-sgpa-cgpa-and-scorecards)
9. [Goals and the grade forecaster](#9-goals-and-the-grade-forecaster)
10. [Assignments and exams](#10-assignments-and-exams)
11. [Analytics and exports](#11-analytics-and-exports)
12. [Campus AI with Gemma](#12-campus-ai-with-gemma)
13. [Importing a timetable or marksheet with AI](#13-importing-a-timetable-or-marksheet-with-ai)
14. [Settings reference](#14-settings-reference)
15. [Your data: storage, backups and deletion](#15-your-data-storage-backups-and-deletion)
16. [Using the web version](#16-using-the-web-version)
17. [Troubleshooting](#17-troubleshooting)
18. [Glossary](#18-glossary)
19. [Getting help](#19-getting-help)

---

## 1. Before you start

CampusIQ is a **local-first, backend-free** college companion. Keep these points in mind:

| What it is | What it isn't |
| :--- | :--- |
| A personal tracker for your timetable, attendance, subjects and grades | An official college record system |
| Stored entirely on your device (or in your browser) | A cloud account. There is no sign-up, login or sync server |
| Optionally assisted by Gemma AI using **your own** key or Mac | A service that bundles or pays for AI on your behalf |
| A tool that shows you estimates and projections | A guarantee of official attendance or results |

**You will need:**

- An iPhone, an Android phone or any modern browser.
- *(Optional, for AI)* A Google AI API key with access to Gemma, **or** a Mac running [Ollama](https://ollama.com) on the same trusted Wi-Fi.

> [!TIP]
> Everything except Campus AI works with no internet connection and no key.

[↑ Back to contents](#top)

---

## 2. Installing CampusIQ

Download the files from the **[latest release](https://github.com/priyanshusharan-cmd/campusiq/releases/latest)**.

### Android (APK)

1. Download `CampusIQ-<version>.apk` on your phone.
2. Open it. If Android asks, allow your browser or file manager to **install unknown apps** for this one install.
3. Tap **Install**, then **Open**.

Later versions install over the top and keep your data, as long as you don't uninstall first.

### iPhone / iPad (IPA)

The IPA is **unsigned**, because publishing to the App Store needs a paid Apple Developer account. Install it with a sideloading tool that signs it with your own Apple ID:

1. Download `CampusIQ-<version>.ipa`.
2. Install it with **[AltStore](https://altstore.io)** or **[Sideloadly](https://sideloadly.io)** using your Apple ID.
3. On the iPhone, open **Settings → General → VPN & Device Management** and trust your Apple ID if asked.

With a free Apple ID, sideloaded apps must be refreshed every 7 days (AltStore can do this automatically).

### Web

Open **<https://campusiq-web.onrender.com>** in any browser. The free host may take a few seconds to wake up on the first visit. On a phone you can use **Share → Add to Home Screen** to get an app-like icon.

### Building from source

```bash
git clone https://github.com/priyanshusharan-cmd/campusiq.git
cd campusiq
npm ci
npm start            # Expo dev server
npm run android      # native Android build
npm run ios          # native iOS build (macOS + Xcode)
npm run build:web    # static web build in dist/
```

[↑ Back to contents](#top)

---

## 3. First launch and onboarding

On first launch CampusIQ walks you through three short screens:

1. **Welcome.** A quick introduction.
2. **Profile.** Your name, college, branch, current semester and semester dates. The semester dates tell the app which days count for attendance.
3. **Subjects.** Add the courses you are taking this semester. You can type them in, load presets, or skip and import them later with AI (see [§13](#13-importing-a-timetable-or-marksheet-with-ai)).

You can change all of this later from your profile and settings, so don't worry about getting it perfect.

> [!TIP]
> Fastest setup: finish onboarding with just your profile, then open **Campus AI**, attach a screenshot of your timetable and ask it to *“add my subjects and weekly classes from this timetable.”*

[↑ Back to contents](#top)

---

## 4. Finding your way around

### Bottom tabs

| Tab | Use it for |
| :--- | :--- |
| **Home** | Greeting, today's classes, attendance and GPA at a glance, quick shortcuts |
| **Schedule** | Your weekly timetable, day by day, plus dated extra classes |
| **Attendance** | Overall and per-subject attendance, marking classes, targets |
| **GPA** | Semester scorecards, SGPA/CGPA tracking and goals |

### The More menu and sidebar

The **More** menu (and the sidebar on larger screens) holds everything else:

- **Academic Hub:** *Subjects*, *Classes* (classes grouped by subject), *Attendance Goals* and *Performance Analytics*.
- **College Configuration:** *Import Subjects*, *College Timings*, *College Grading Scheme*, *Passing Criteria*.
- **App Settings & Support:** *App Settings*, *AI Assistant*, *Privacy Policy*, *About Us*.

### Light and dark mode

Go to **App Settings → Appearance → Theme Mode** and pick *Light*, *Dark* or follow your system.

[↑ Back to contents](#top)

---

## 5. Subjects

Subjects are the backbone of CampusIQ. Classes, attendance and grades all link back to them.

### Adding a subject

Open **Academic Hub → Subjects** and tap **add**. Fill in:

| Field | Notes |
| :--- | :--- |
| **Name** | The full course title, e.g. *Computer Networks* |
| **Code** | e.g. *23CS5PCCON*. Helps AI match imports to the right course |
| **Credits** | Used for SGPA weighting |
| **Faculty** | Optional |
| **Type** | *Theory Only* or *Theory + Practical*. Practical subjects get separate lab attendance |
| **Color & icon** | Makes the course easy to spot across the app |

### Editing or deleting

Tap a subject to open its detail page, then edit any field. Deleting a subject can also remove its linked classes and attendance; the confirmation dialog tells you exactly what will go.

### Importing a list of subjects

Use **College Configuration → Import Subjects** to load presets, or let Campus AI read them from a timetable or course list.

[↑ Back to contents](#top)

---

## 6. Timetable and classes

### Weekly classes

In **Schedule**, add a class by choosing:

- the **subject**
- the **day** (Monday to Sunday)
- **start and end time**
- **session type:** lecture or lab
- **room** (optional; a lecture and its lab can be in different rooms)

Weekly classes repeat every week through your semester dates.

### Extra (dated) classes

Got a one-off makeup class? Add an **extra class** for a specific date. It appears only on that day and counts toward attendance like any other class.

### Classes by subject

**Academic Hub → Classes** lists every slot grouped by subject, with day, time, room and faculty. Tap a class to edit it, or add another class for that subject.

### College timings and week start

Set your college day under **College Configuration → College Timings** (*Start Time*, *End Time*). Set which day your week starts on under **App Settings** (*Start of Week*).

### Holidays and exam days

Holiday and exam-day settings affect which classes are shown and counted, so a public holiday won't drag your attendance down.

[↑ Back to contents](#top)

---

## 7. Attendance

### Marking a class

For each scheduled class, mark one of:

| Status | Counts as |
| :--- | :--- |
| **Present** | Attended (adds to both present and total) |
| **Absent** | Missed (adds to total only) |
| **Cancelled** | Not held. Excluded from your percentage |
| **Holiday** | Not held. Excluded from your percentage |

You can also mark a whole date range at once. Double-check the dates and scope before confirming a month-wide change.

### Theory vs lab

For *Theory + Practical* subjects, theory and lab attendance are tracked **separately**, because colleges usually require the target in each.

### Your target and what it means

Set your target under **Attendance Goals** (75% is a common default). For every subject, CampusIQ tells you:

- **Current percentage:** `present ÷ total × 100`
- **Safe to miss:** how many more classes you can skip and still stay at or above the target
- **Must attend:** if you're below target, how many classes *in a row* you need to attend to get back

**Worked example:** 21 present out of 30 is 70% with a 75% target.
Classes needed = ⌈(75 × 30 − 100 × 21) ÷ (100 − 75)⌉ = ⌈150 ÷ 25⌉ = **6**.

### What-if simulation

Before skipping (or committing to) a run of classes, use the simulator to see what your percentage would become if you **miss** or **attend** the next *n* classes.

> [!NOTE]
> Your college's attendance rules are what officially count. CampusIQ's numbers are only as accurate as what you mark.

[↑ Back to contents](#top)

---

## 8. Grades: SGPA, CGPA and scorecards

### Set up your grading scheme first

Under **College Configuration**:

- **College Grading Scheme:** set internal and external maximum marks and the grade boundaries (marks → grade letter → grade point).
- **Passing Criteria:** set the minimum marks needed to pass.

The grading wizard can walk you through this.

### Semester scorecards

In the **GPA** tab, open a semester and add a row per course: code, name, credits, marks or grade, and grade point. CampusIQ calculates:

| Metric | Formula |
| :--- | :--- |
| **SGPA** | Σ(grade point × credits) ÷ Σ credits |
| **CGPA** | Σ(SGPA × semester credits) ÷ Σ credits, across saved semesters |
| **Percentage (approx.)** | (CGPA − 0.75) × 10 |

Zero-credit courses can be recorded but don't affect GPA weighting.

### Subject impact

Each subject shows how much it contributes to your SGPA and how much you'd lose by dropping a grade. Use it to decide where to focus.

[↑ Back to contents](#top)

---

## 9. Goals and the grade forecaster

### Target CGPA → required SGPA

Enter the CGPA you're aiming for. CampusIQ works out the SGPA you need this semester:

`required SGPA = (target × credits after this sem − current CGPA × completed credits) ÷ this semester's credits`

If the answer is above 10, the app tells you the target isn't reachable this semester and shows the maximum CGPA you *can* reach.

### Target SGPA → marks needed per subject

The **forecaster** takes your internal and lab marks so far and finds the **easiest path** to your target SGPA. It starts every subject at a pass, then raises the lowest-cost grades until the target is met, and shows the **external marks each subject needs**.

### Assessment components

Inside a subject you can track each component (tests, assignments, labs) and move sliders to see projected scores.

> [!NOTE]
> Projections are estimates based on the data and grading scheme you entered, not official results.

[↑ Back to contents](#top)

---

## 10. Assignments and exams

- **Assignments:** add a title, subject and due date. Items are colored by urgency (overdue, due soon, upcoming).
- **Exams:** add the subject, date and time; CampusIQ shows a countdown.
- **Reminders:** where your device supports notifications, you can get a reminder before deadlines. You can manage notification permission in your phone's settings.

[↑ Back to contents](#top)

---

## 11. Analytics and exports

- **Performance Analytics** shows attendance and grade trends with charts.
- **Exports:** create a shareable copy of your data, such as a timetable, subjects, full data or an analytics/academic **PDF** report. Exports are generated **on your device**, and the PDF needs no internet.
- When you share an export, the app or person receiving it controls that copy.

[↑ Back to contents](#top)

---

## 12. Campus AI with Gemma

Campus AI answers questions about your academics and can prepare changes to your data. It is **optional**.

### Choose a mode

Open **App Settings → AI Assistant**:

| Mode | How it works | Needs |
| :--- | :--- | :--- |
| **Gemma Cloud** | The app calls Google's API directly | A Google AI API key with Gemma access and quota |
| **Gemma Local** | The app calls Ollama on your Mac | Mac on the same trusted Wi-Fi running `gemma4:e4b-it-qat` |
| **Automatic** | Cloud first, local as fallback | A key, plus an optional working local connection |
| **Basic offline help** | Answers from your saved data with simple calculations | Nothing. It can't read images or import data |

### Adding your Google key

1. Get a key from [Google AI Studio](https://aistudio.google.com).
2. Paste it in **AI Assistant** and save.
3. Tap **Test connection**.

On iPhone and Android the key is kept in the system's secure storage. On the web it stays only in memory and is cleared when you reload the page. **No key is ever bundled with the app.**

### Setting up Gemma Local on a Mac

```bash
ollama pull gemma4:e4b-it-qat
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

In the app, enter your Mac's address on your Wi-Fi, e.g. `http://192.168.1.52:11434`, and test the connection. Keep the Mac awake.

> [!CAUTION]
> Never expose an unauthenticated Ollama server to the public internet.

### Chatting

Ask in plain language:

- *“How many classes can I skip in Computer Networks?”*
- *“What do I need in the externals to get an 8.5 SGPA?”*
- *“Which subject is pulling my SGPA down the most?”*

The app always shows which provider answered. Closing the chat cancels any request still in progress.

[↑ Back to contents](#top)

---

## 13. Importing a timetable or marksheet with AI

1. **Open Campus AI** and attach an image: pick a photo, paste one, or (on web) drag and drop. JPEG, PNG and WebP up to 3 MB are supported.
2. **Turn on the ⚡ lightning control.** This lets the assistant prepare app changes. Without it, the chat only answers questions.
3. **Say what you want**, for example:
   - *“Add the subjects and faculty from this timetable.”*
   - *“Replace my weekly classes with this timetable.”*
   - *“Import this marksheet into Semester 3.”*
4. **Review the proposal.** You'll see the target semester, every extracted row, issue counts and an **Issues only** filter. Fix times with the pickers, edit or remove rows, and approve any suggested lab-to-course mappings.
5. **Choose the replacement scope** (for timetables): *weekly only* or *weekly + dated classes*, for the selected semester only.
6. **Confirm.** CampusIQ validates and saves everything together; if anything fails, nothing is half-saved.

### Tips for clean imports

- Crop to just the timetable or marksheet, and cover names, IDs and signatures you don't need to share.
- If AM/PM is missing, CampusIQ only assumes afternoon when the column order proves it. Otherwise it asks you.
- Real clashes are shown, never hidden by moving a class.
- Import one semester's marksheet at a time and check printed credits and grades.
- Follow-ups work while the chat is open: *“now add the lab batches too.”*

> [!WARNING]
> AI can misread merged cells, batches, sections or faculty names. Always compare the review against the original document. A message in chat saying something was done is **not** proof it was saved; only a confirmed review saves data.

[↑ Back to contents](#top)

---

## 14. Settings reference

| Setting | Where | What it does |
| :--- | :--- | :--- |
| Theme Mode | App Settings → Appearance | Light, dark or system |
| Haptic Feedback | App Settings | Vibration feedback on taps |
| Start of Week | App Settings | First day shown in weekly views |
| App Lock | App Settings | Require Face ID / fingerprint / passcode to open (native) |
| AI Assistant | App Settings | Mode, Google key, local endpoint, connection tests |
| Attendance Goals | Academic Hub | Target attendance percentage |
| College Timings | College Configuration | Daily start and end times |
| College Grading Scheme | College Configuration | Internal/external marks and grade boundaries |
| Passing Criteria | College Configuration | Minimum marks to pass |
| Import Subjects | College Configuration | Load subject presets |

[↑ Back to contents](#top)

---

## 15. Your data: storage, backups and deletion

- **Where it lives:** in app storage on your phone, or in your browser's storage for the web version. There is **no CampusIQ server**, so nobody else, including the developer, can see your records.
- **Backups:** use the export options to keep a copy somewhere you trust before big changes. Uninstalling the app or clearing browser data deletes your records with no way to recover them.
- **Deleting everything:** the delete-data option in Settings clears your records, profile, preferences and saved Google key, then returns you to onboarding. It does not revoke your key with Google or delete files you previously exported.
- **What AI sends:** only when you use AI, your message, recent chat, relevant academic context and any attached image go to the provider you selected.

Read the full **[Privacy Policy](PRIVACY_POLICY.md)** for details.

[↑ Back to contents](#top)

---

## 16. Using the web version

- Data is stored per browser and per device. Your laptop and phone browsers won't share records.
- Your Google key is kept in memory only and must be re-entered after a reload.
- An HTTPS site may be blocked from reaching an `http://` Ollama server on your Mac; use the native app for Gemma Local.
- Private/incognito windows may delete your data when closed.

[↑ Back to contents](#top)

---

## 17. Troubleshooting

<details>
<summary><strong>AI says the connection failed</strong></summary>

- **Cloud:** check that the key is pasted correctly, has Gemma access and has quota left. Try **Test connection**.
- **Local:** check that the Mac is awake, Ollama is running with `OLLAMA_HOST=0.0.0.0:11434`, the phone is on the same Wi-Fi and the address is the Mac's current IP.
</details>

<details>
<summary><strong>The text test works but image imports fail</strong></summary>

A text test doesn't prove image support or quota for larger requests. Try a smaller, tightly cropped image under 3 MB, or switch modes.
</details>

<details>
<summary><strong>Imported times are wrong (AM/PM)</strong></summary>

Fix them in the review with the time pickers before confirming. CampusIQ leaves ambiguous times for you rather than guessing.
</details>

<details>
<summary><strong>My attendance percentage looks off</strong></summary>

Check that cancelled classes and holidays are marked as such (they're excluded), that your semester dates are correct, and that theory and lab sessions are marked separately.
</details>

<details>
<summary><strong>SGPA doesn't match my marksheet</strong></summary>

Check credits and grade points for each row and confirm your grading scheme. Missing or zero-credit rows change the total.
</details>

<details>
<summary><strong>Android won't install the APK</strong></summary>

Allow *install unknown apps* for the app you opened the APK from. If an older build signed differently is installed, uninstall it first (export a backup before you do).
</details>

<details>
<summary><strong>The iOS app stopped opening after a week</strong></summary>

Apps sideloaded with a free Apple ID expire after 7 days. Refresh it in AltStore or reinstall with Sideloadly.
</details>

<details>
<summary><strong>The website is slow to load the first time</strong></summary>

The free host sleeps when idle and wakes on the first visit. Give it a few seconds.
</details>

[↑ Back to contents](#top)

---

## 18. Glossary

| Term | Meaning |
| :--- | :--- |
| **SGPA** | Semester Grade Point Average: credit-weighted average for one semester |
| **CGPA** | Cumulative GPA across all completed semesters |
| **CIE / internals** | Continuous internal evaluation marks from tests and assignments |
| **SEE / externals** | Semester-end examination marks |
| **Grade point** | The number (e.g. 10, 9, 8…) your grade maps to |
| **Credits** | The weight of a course in GPA calculations |
| **Proposal** | An AI-prepared set of changes waiting for your review |
| **Ollama** | Free software that runs AI models like Gemma on your own computer |
| **BYOK** | Bring your own key: you supply the AI API key, nothing is bundled |

[↑ Back to contents](#top)

---

## 19. Getting help

- **Bug or feature request:** [open a GitHub issue](https://github.com/priyanshusharan-cmd/campusiq/issues). Say which screen, what you expected and what happened.
- **Import problem:** include a small **redacted** example and describe the cell that was misread.
- **Never** share API keys, full marksheets or student IDs in an issue.

<div align="center">

**Plan your week. Understand your progress. Keep the final say.**

[↑ Back to top](#top)

</div>
