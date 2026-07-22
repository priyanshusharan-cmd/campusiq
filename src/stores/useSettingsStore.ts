// CampusIQ — Settings Store (Zustand)
// Synchronous local storage for app preferences

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeMode } from '@/theme';
import { DEFAULTS } from '@/constants';
import { zustandStorage } from './storage';

// ─── Grading Config Types ──────────────────────────────────────────────────────

/** Configuration for Theory-only subjects */
export interface TheoryGradingConfig {
  cieCount: number;            // Number of CIE tests (default 3)
  cieBestOf: number;           // Best N of total (default 2)
  cieMaxMarks: number;         // Max marks per CIE after reduction (default 20)
  aatEnabled: boolean;         // Whether AAT component exists (default true)
  aatMaxMarks: number;         // AAT marks (default 10)
  maxInternalMarks: number;    // Total internal target (default 50)
  maxExternalMarks: number;    // SEE max marks (default 50)
}

/** Configuration for Practical (Lab + Theory component) subjects */
export interface PracticalGradingConfig {
  labCieCount: number;             // CIE count for practicals (default 3)
  labCieBestOf: number;            // Best N (default 2)
  labCieMaxMarks: number;          // Max marks per CIE after reduction (default 10)
  labAatEnabled: boolean;          // AAT exists (default true)
  labAatMaxMarks: number;          // AAT marks (default 5)
  labComponentMarks: number;       // Lab exam marks (default 25)
  labMaxInternalMarks: number;     // Total internal for practicals (default 50)
  labMaxExternalMarks: number;     // SEE max marks for practicals (default 50)
}

// ─── Full Settings State ────────────────────────────────────────────────────────

interface SettingsState {
  // Appearance
  theme: ThemeMode;
  accentColor: string;

  // Academic
  attendanceTarget: number;
  weekStartsOn: 0 | 1; // 0=Monday, 1=Sunday
  collegeStartTime: string;
  collegeEndTime: string;

  // Notifications
  hapticFeedback: boolean;
  classReminders: boolean;
  reminderMinutesBefore: number;
  weeklyDigest: boolean;

  // App state
  onboardingCompleted: boolean;
  hasSeenWelcome: boolean;

  // Engagement
  streakCount: number;
  lastActiveDate: string;

  // Goal
  targetCGPA: number;
  targetSemester: number;
  goalMotivation: string;

  // Passing Marks
  passingMarks: number;

  // Grading — Theory
  cieCount: number;
  cieBestOf: number;
  cieMaxMarks: number;
  aatEnabled: boolean;
  aatMaxMarks: number;
  maxInternalMarks: number;
  maxExternalMarks: number;

  // Grading — Practical
  labCieCount: number;
  labCieBestOf: number;
  labCieMaxMarks: number;
  labAatEnabled: boolean;
  labAatMaxMarks: number;
  labComponentMarks: number;
  labMaxInternalMarks: number;
  labMaxExternalMarks: number;

  // ── Legacy (kept for backward compat, not used in new UI) ──
  maxLabMarks: number;

  appLockEnabled: boolean;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: string) => void;
  setWeekStartsOn: (day: 0 | 1) => void;
  setAttendanceTarget: (target: number) => void;
  setCollegeTimings: (start: string, end: string) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  toggleHapticFeedback: () => void;
  toggleClassReminders: () => void;
  toggleWeeklyDigest: () => void;
  toggleAppLock: () => void;
  updateStreak: (todayStr: string) => void;
  setReminderMinutes: (minutes: number) => void;
  setTargetCGPA: (target: number) => void;
  setTargetSemester: (semester: number) => void;
  setGoalMotivation: (text: string) => void;
  setPassingMarks: (marks: number) => void;
  setTheoryConfig: (config: TheoryGradingConfig) => void;
  setPracticalConfig: (config: PracticalGradingConfig) => void;
  resetSettings: () => void;
}

// ─── Default Values ─────────────────────────────────────────────────────────────

const initialState = {
  theme: 'system' as ThemeMode,
  accentColor: '#7C5CFC',
  attendanceTarget: DEFAULTS.attendanceTarget,
  weekStartsOn: 0 as const,
  collegeStartTime: '08:00',
  collegeEndTime: '18:00',
  hapticFeedback: true,
  classReminders: true,
  reminderMinutesBefore: DEFAULTS.reminderMinutesBefore,
  weeklyDigest: true,
  onboardingCompleted: false,
  hasSeenWelcome: false,
  streakCount: 0,
  lastActiveDate: '',
  targetCGPA: 0,
  targetSemester: 8,
  goalMotivation: '',
  passingMarks: 40,

  // Theory defaults (your college: 3 CIEs for 20, best 2, AAT 10, internal 50, external 50)
  cieCount: 3,
  cieBestOf: 2,
  cieMaxMarks: 20,
  aatEnabled: true,
  aatMaxMarks: 10,
  maxInternalMarks: 50,
  maxExternalMarks: 50,

  // Practical defaults (3 CIEs for 10, best 2, AAT 5, lab 25, internal 50, external 50)
  labCieCount: 3,
  labCieBestOf: 2,
  labCieMaxMarks: 10,
  labAatEnabled: true,
  labAatMaxMarks: 5,
  labComponentMarks: 25,
  labMaxInternalMarks: 50,
  labMaxExternalMarks: 50,

  // Legacy
  maxLabMarks: 0,
  
  appLockEnabled: false,
};

// ─── Store ──────────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTheme: (theme) => set({ theme }),
      
      setAccentColor: (color) => set({ accentColor: color }),
      
      setWeekStartsOn: (day) => set({ weekStartsOn: day }),

      setAttendanceTarget: (target) => set({ attendanceTarget: Math.max(0, Math.min(100, target)) }),

      setCollegeTimings: (start, end) => set({ collegeStartTime: start, collegeEndTime: end }),

      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),

      toggleHapticFeedback: () => set((s) => ({ hapticFeedback: !s.hapticFeedback })),

      toggleClassReminders: () => set((s) => ({ classReminders: !s.classReminders })),

      toggleWeeklyDigest: () => set((s) => ({ weeklyDigest: !s.weeklyDigest })),
      
      toggleAppLock: () => set((s) => ({ appLockEnabled: !s.appLockEnabled })),

      setReminderMinutes: (minutes) => set({ reminderMinutesBefore: minutes }),

      updateStreak: (todayStr) => {
        const { lastActiveDate, streakCount } = get();
        if (lastActiveDate === todayStr) return; // Already updated today

        // Check if yesterday was active
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastActiveDate === yesterdayStr) {
          set({ streakCount: streakCount + 1, lastActiveDate: todayStr });
        } else if (lastActiveDate === '') {
          set({ streakCount: 1, lastActiveDate: todayStr });
        } else {
          set({ streakCount: 1, lastActiveDate: todayStr }); // Reset streak
        }
      },

      resetSettings: () => set(initialState),

      setTargetCGPA: (target) => set({ targetCGPA: Math.max(0, Math.min(10, target)) }),
      setTargetSemester: (semester) => set({ targetSemester: Math.max(1, Math.min(12, semester)) }),
      setGoalMotivation: (text) => set({ goalMotivation: text }),
      setPassingMarks: (marks) => set({ passingMarks: Math.max(0, Math.min(100, marks)) }),

      setTheoryConfig: (config) => set({
        cieCount: Math.max(1, config.cieCount),
        cieBestOf: Math.max(1, Math.min(config.cieCount, config.cieBestOf)),
        cieMaxMarks: Math.max(1, config.cieMaxMarks),
        aatEnabled: config.aatEnabled,
        aatMaxMarks: Math.max(0, config.aatMaxMarks),
        maxInternalMarks: Math.max(1, config.maxInternalMarks),
        maxExternalMarks: Math.max(1, config.maxExternalMarks),
      }),

      setPracticalConfig: (config) => set({
        labCieCount: Math.max(1, config.labCieCount),
        labCieBestOf: Math.max(1, Math.min(config.labCieCount, config.labCieBestOf)),
        labCieMaxMarks: Math.max(1, config.labCieMaxMarks),
        labAatEnabled: config.labAatEnabled,
        labAatMaxMarks: Math.max(0, config.labAatMaxMarks),
        labComponentMarks: Math.max(0, config.labComponentMarks),
        labMaxInternalMarks: Math.max(1, config.labMaxInternalMarks),
        labMaxExternalMarks: Math.max(1, config.labMaxExternalMarks),
      }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
