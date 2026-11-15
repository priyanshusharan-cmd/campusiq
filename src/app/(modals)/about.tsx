import React from 'react';
import Constants from 'expo-constants';
import { InformationPage, type InformationSection } from '@/components/ui/InformationPage';

const REPO = 'https://github.com/priyanshusharan-cmd/campusiq';
const version = Constants.expoConfig?.version ?? '1.0.0';

const sections: InformationSection[] = [
  {
    title: 'Why CampusIQ exists',
    icon: 'bulb-outline',
    paragraphs: [
      'College information often lives in separate screenshots, notebooks and spreadsheets. CampusIQ brings schedules, attendance and academic progress into one place so you can see what is happening and make better day-to-day decisions.',
      'The goal is practical clarity: know which class is next, understand attendance against your own target, organize subjects and keep reviewed results together. Your institution remains the authority on official attendance, credits and results.',
    ],
  },
  {
    title: 'Home, timetable and subjects',
    icon: 'calendar-outline',
    paragraphs: [
      'Home shows GPA information, attendance and today’s classes with shortcuts into the academic screens. The Academic Hub brings together Subjects, Classes, attendance goals and analytics.',
      'The timetable supports Monday through Sunday, recurring weekly classes and dated extra classes. Rooms and session types belong to individual slots, so a lecture and a lab can meet in different places. Subjects keep their name, code, credits, faculty, type, color and icon.',
    ],
  },
  {
    title: 'Attendance with context',
    icon: 'checkmark-done-outline',
    paragraphs: [
      'Track present, absent, cancelled and holiday statuses against scheduled classes. Theory and lab sessions are tracked separately, and each subject shows how many classes you can miss or must attend to stay at your target.',
      'Bulk and date-range actions prepare attendance changes for the relevant classes. Check dates and scope before confirming a month-wide change, especially if your institution applies a different attendance policy.',
    ],
  },
  {
    title: 'SGPA, CGPA and forecasting',
    icon: 'stats-chart-outline',
    paragraphs: [
      'Semester scorecards keep course results with credits, marks and grade points. SGPA is credit-weighted from reviewed rows, and CGPA is derived from saved semesters using your grading configuration.',
      'The forecaster estimates the external marks each subject needs for a target SGPA. Predictions are estimates based on the data you entered, not a promise of a future result.',
    ],
  },
  {
    title: 'Gemma AI — optional, reviewed, yours',
    icon: 'sparkles-outline',
    paragraphs: [
      'Ask questions in ordinary language, or attach a timetable or marksheet and enable the lightning control to prepare changes. Every change arrives as an editable proposal; nothing is saved until you confirm.',
      'Run Gemma in Google’s cloud with your own API key, or on your own Mac through Ollama. Local mode means the machine you configured, not the phone itself. Both modes can fail, hit quota limits or misread an image, so always check the review.',
    ],
  },
  {
    title: 'No backend, by design',
    icon: 'cloud-offline-outline',
    paragraphs: [
      'CampusIQ has no CampusIQ server, account or database. Records live in app or browser storage on your device, and every calculation runs locally. The web version is a static site on GitHub Pages; the Android and iOS apps are self-contained.',
      'The only network traffic is what you choose: AI requests go directly to the provider you selected, and exports go where you send them. Read the Privacy Policy for the full data flow.',
    ],
  },
  {
    title: 'People and technology',
    icon: 'people-outline',
    paragraphs: [
      'Created by Priyanshu Sharan, a computer science student at BMS College of Engineering, Bangalore. CampusIQ placed 3rd at Hacktoberfest 2026.',
      'Built with Expo, React Native, TypeScript and Zustand. References to Google, Gemma and Ollama identify the tools involved; they do not imply endorsement by those organizations or by your college.',
    ],
  },
  {
    title: 'Feedback and bug reports',
    icon: 'chatbubbles-outline',
    paragraphs: [
      'Useful feedback names the screen involved, the result you expected and a small example of the mismatch. For an import issue, describe the section or batch and the specific cell that was read incorrectly.',
      'Open an issue on GitHub. Redact student identifiers, private grades, signatures and API keys from any example you share.',
    ],
  },
];

export default function Screen() {
  return <InformationPage
    title="About CampusIQ"
    heading="CampusIQ"
    subtitle={`Version ${version} · Built for student life`}
    introduction="A practical college companion for your timetable, attendance, subjects and grades — with optional Gemma AI and a review step before anything changes."
    logo
    chips={[
      { label: `v${version}`, icon: 'pricetag-outline', color: '#3B82F6' },
      { label: '3rd place · Hacktoberfest 2026', icon: 'trophy-outline', color: '#D97706' },
      { label: 'MIT licensed', icon: 'ribbon-outline', color: '#10B981' },
    ]}
    highlights={[
      { icon: 'phone-portrait-outline', title: 'Local-first', text: 'Your records stay on this device. No sign-up needed.', color: '#3B82F6' },
      { icon: 'server-outline', title: 'No backend', text: 'No CampusIQ servers, accounts or databases — ever.', color: '#10B981' },
      { icon: 'key-outline', title: 'Your own AI key', text: 'Gemma in the cloud with your key, or on your Mac.', color: '#8B5CF6' },
      { icon: 'shield-checkmark-outline', title: 'You approve', text: 'AI changes are proposals you review before saving.', color: '#F59E0B' },
    ]}
    sections={sections}
    actions={[
      { title: 'Privacy Policy', subtitle: 'What stays local and what AI sends', icon: 'shield-checkmark-outline', color: '#10B981', route: '/(modals)/privacy-policy' },
      { title: 'User manual', subtitle: 'Step-by-step guide to every feature', icon: 'book-outline', color: '#3B82F6', url: `${REPO}/blob/main/docs/USER_MANUAL.md` },
      { title: 'Source code on GitHub', subtitle: 'priyanshusharan-cmd/campusiq', icon: 'logo-github', color: '#6366F1', url: REPO },
      { title: 'Report a bug or request a feature', subtitle: 'Open a GitHub issue', icon: 'bug-outline', color: '#F43F5E', url: `${REPO}/issues` },
      { title: 'Download the latest release', subtitle: 'Android APK, iOS IPA and web', icon: 'download-outline', color: '#F59E0B', url: `${REPO}/releases/latest` },
    ]}
    footer={`CampusIQ ${version} · Made with care by Priyanshu Sharan\nNot an official college system.`}
  />;
}
