// Campora — Constants: Default Values

export const DEFAULTS = {
  attendanceTarget: 85,       // 85% minimum attendance
  creditsPerSubject: 3,
  totalSemesters: 8,
  maxCredits: 160,            // Typical B.Tech total credits
  maxCreditsPerSemester: 30,  // Maximum allowed credits in a single semester
  weekStartsOn: 0 as const,  // Monday
  reminderMinutesBefore: 10,
  classStartHour: 8,          // 8 AM
  classEndHour: 18,           // 6 PM
  classSlotDuration: 60,      // 60 minutes default
} as const;

export const APP_INFO = {
  name: 'CampusIQ',
  version: '1.0.0',
  tagline: 'Your Academic Companion',
  description: 'The operating system for college students.',
} as const;
