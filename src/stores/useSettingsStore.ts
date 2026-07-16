// Campora — Settings Store (Zustand)
// Synchronous local storage for app preferences

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeMode } from '@/theme';
import { DEFAULTS } from '@/constants';
import { zustandStorage } from './storage';

interface SettingsState {
  // Appearance
  theme: ThemeMode;
  accentColor: string;

  // Academic
  attendanceTarget: number;
  weekStartsOn: 0 | 1; // 0=Monday, 1=Sunday

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

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setAttendanceTarget: (target: number) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  toggleHapticFeedback: () => void;
  toggleClassReminders: () => void;
  toggleWeeklyDigest: () => void;
  updateStreak: (todayStr: string) => void;
  setReminderMinutes: (minutes: number) => void;
  setTargetCGPA: (target: number) => void;
  setTargetSemester: (semester: number) => void;
  setGoalMotivation: (text: string) => void;
  resetSettings: () => void;
}

const initialState = {
  theme: 'system' as ThemeMode,
  accentColor: '#7C5CFC',
  attendanceTarget: DEFAULTS.attendanceTarget,
  weekStartsOn: 0 as const,
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
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTheme: (theme) => set({ theme }),

      setAttendanceTarget: (target) => set({ attendanceTarget: Math.max(0, Math.min(100, target)) }),

      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),

      toggleHapticFeedback: () => set((s) => ({ hapticFeedback: !s.hapticFeedback })),

      toggleClassReminders: () => set((s) => ({ classReminders: !s.classReminders })),

      toggleWeeklyDigest: () => set((s) => ({ weeklyDigest: !s.weeklyDigest })),

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
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
