import React from 'react';
import { InformationPage } from '@/components/ui/InformationPage';

const sections = [
  {
    "title": "Why CampusIQ exists",
    "paragraphs": [
      "College information often lives in separate screenshots, notebooks and spreadsheets. CampusIQ brings schedules, attendance and academic progress into one place so students can see what is happening and make better day-to-day decisions.",
      "The goal is practical clarity: know which class is next, understand attendance against your own target, organize subjects and keep reviewed results together. CampusIQ supports your decisions; your institution remains the authority on official attendance, credits and results."
    ]
  },
  {
    "title": "Home and navigation",
    "paragraphs": [
      "Home provides a quick view of GPA information, attendance and today’s classes, with shortcuts into the academic screens. Empty states distinguish a missing schedule or missing results from an actual academic score.",
      "Academic Hub brings together Subjects, Classes, attendance goals and analytics. The Classes screen groups current-semester timetable entries by subject, with weekday or date, time, room and available faculty details. Tap a class to edit it or add another class for the subject."
    ]
  },
  {
    "title": "Subjects that reflect your courses",
    "paragraphs": [
      "Create subjects with a full name, code, credits, faculty, description, type, color and icon. Subject type distinguishes Theory Only from Theory + Practical; list badges use Theory and Lab for readability.",
      "Colors help distinguish courses across the app. AI-created subjects receive varied defaults, while existing or manually selected colors are preserved. A subject’s practical component can have separate timetable sessions without needing a duplicate course record."
    ]
  },
  {
    "title": "A timetable for the full week",
    "paragraphs": [
      "The timetable supports Monday through Sunday, recurring weekly classes and dated extra classes. Rooms and session types belong to individual class slots so a lecture and a lab can meet in different places.",
      "Week and calendar views help you browse the schedule. Holiday and exam-day settings affect which classes are shown or counted. Imported schedules are proposals: different sections and batches may have different classes, rooms or instructors, and one sample timetable is never a universal template."
    ]
  },
  {
    "title": "Attendance with context",
    "paragraphs": [
      "Track present, absent, cancelled and holiday statuses against scheduled classes. Subject summaries and overall attendance help show the relationship between your records and the target you set.",
      "Bulk and date-range actions can prepare attendance changes for the relevant classes. Cancelled classes and calendar exceptions need to be treated according to the app’s rules. Verify dates and scope before confirming a month-wide change, especially if your institution applies a different attendance policy."
    ]
  },
  {
    "title": "SGPA, CGPA and scorecards",
    "paragraphs": [
      "Semester scorecards keep course results with credits, marks, grade letters or grade points. The app calculates SGPA using reviewed credits and grade points and derives CGPA from saved semester information. Your grading configuration determines how entered marks or letters are interpreted.",
      "A marksheet can be supplied to AI for a proposed results import. Results can be saved into a scorecard without adding every course to the Subjects list. Import one semester at a time and check the printed semester, credits, maximum marks and grades. A document’s reported total and the calculated total may differ if the entered rows are incomplete or interpreted incorrectly."
    ]
  },
  {
    "title": "Planning, goals and academic tools",
    "paragraphs": [
      "Assignments, exam details, attendance targets and academic analytics provide additional planning tools. College timings, grading settings and passing criteria can be configured to reflect your own academic setup.",
      "Predictions and expected scores are estimates based on entered marks, targets and configuration. They are not a promise of a future result. Missing or outdated records can make a plausible-looking estimate inaccurate, so update the underlying data before relying on it."
    ]
  },
  {
    "title": "Gemma in the cloud or on your Mac",
    "paragraphs": [
      "CampusIQ AI supports cloud processing through Google’s API and a configurable Ollama endpoint, such as Gemma running on your Mac. Automatic routing can use the enabled fallback when a provider is unavailable.",
      "Local mode still sends data to the machine running the configured endpoint; it does not mean the model runs on the iPhone. Cloud mode requires the relevant connection and provider access. Both modes can fail, reach quota limits or misread an image. The connection test verifies only the particular test it performs."
    ]
  },
  {
    "title": "Talk naturally, then review",
    "paragraphs": [
      "Ask a question or describe the change you want in ordinary language. Recent conversation helps the assistant understand follow-ups such as “those subjects” or “add the classes from that image.” The current chat can reuse its source image; a new chat may require attaching it again.",
      "Enable the lightning control to prepare supported app changes. A request should produce an editable proposal rather than repeated promises. Review the extracted rows, approve any lab-to-course mappings and confirm the final save. Merely seeing a plan in chat does not mean anything was saved."
    ]
  },
  {
    "title": "Smarter imports with clear limits",
    "paragraphs": [
      "Timetable imports attempt to read legends, full course titles, subject codes, lab blocks and merged time columns. Exact duplicates and explicit time formatting can be cleaned automatically. A defective proposal may receive one source-based correction attempt before review.",
      "The app does not deliberately move or drop a real class just to make validation pass. Ambiguous sections, batches, course mappings and genuine overlapping sessions still need your judgment. Replacement offers a selected-semester scope for weekly slots or weekly plus dated classes, and leaves other semesters alone."
    ]
  },
  {
    "title": "Privacy and ownership",
    "paragraphs": [
      "Core academic records are stored in app or browser storage and ordinary calculations run locally. Optional AI processing sends messages, images and relevant context to the selected destination. Exports create copies that you control through the receiving application.",
      "Read Privacy Policy for the actual data flow, key storage, permissions and deletion behavior. Offline-first describes the core record-keeping experience; it is not a claim that cloud AI, a remote Ollama endpoint or external sharing never transmits data."
    ]
  },
  {
    "title": "Designed for everyday use",
    "paragraphs": [
      "CampusIQ includes light and dark appearance options, readable course colors, editable forms and platform-aware navigation. Some device services, including notifications, authentication and file sharing, differ between native and browser environments.",
      "Keep your app and academic records up to date. Save a backup before major changes if you need a recoverable copy, and check imported content before applying it. No assistant or calculation can guarantee perfect accuracy across every institution’s rules."
    ]
  },
  {
    "title": "People and technology",
    "paragraphs": [
      "Created by Priyanshu Sharan. CampusIQ is built with Expo, React Native and TypeScript, with local application state and academic calculation tools. It brings manual tracking and optional AI assistance into the same student workflow.",
      "References to Google, Gemma, Ollama and other technologies identify the tools involved; they do not imply that CampusIQ is endorsed by those organizations or by your college. Feature descriptions on this page cover the current app rather than an institution-wide integration."
    ]
  },
  {
    "title": "Feedback and the next improvement",
    "paragraphs": [
      "Useful feedback includes the screen involved, the intended result and a small example showing the mismatch. For an extraction issue, explain the section or batch and the specific cell that was read incorrectly.",
      "Contact the developer through the project or distribution channel you used to get CampusIQ. Redact student identifiers, private grades, signatures and keys from examples unless they are essential and you intend to share them. The most valuable improvements are the ones that make the app clearer and more reliable for students."
    ]
  }
];

export default function Screen() {
  return <InformationPage title="About CampusIQ" subtitle="Version 1.0.0 · Built for student life" introduction="A practical college companion for your timetable, attendance, subjects and academic progress—with optional Gemma assistance and review before AI changes are saved." sections={sections} logo={true} links={[]} />;
}
