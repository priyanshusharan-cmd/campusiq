// Campora — Timetable Store (Zustand)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TimetableEntry, TimetableEntryWithSubject, ID, DayOfWeek, ClassType } from '@/types';
import { generateId } from '@/types';
import { getCurrentDayOfWeek, isTimeInRange, isTimePast } from '@/lib';
import { useSubjectStore } from './useSubjectStore';
import { useProfileStore } from './useProfileStore';
import { format } from 'date-fns';
import { zustandStorage } from './storage';

interface TimetableState {
  entries: TimetableEntry[];
  addEntry: (data: { subjectId: ID; dayOfWeek: DayOfWeek; date?: string; startTime: string; endTime: string; room?: string; type?: ClassType; color?: string }) => TimetableEntry;
  updateEntry: (id: ID, updates: Partial<TimetableEntry>) => void;
  removeEntry: (id: ID) => void;
  removeEntriesBySubject: (subjectId: ID) => void;
  getEntriesForDay: (day: DayOfWeek) => TimetableEntry[];
  loadEntries: (entries: TimetableEntry[]) => void;
  clearEntries: () => void;
  events: Record<string, 'holiday' | 'exam'>;
  setEvent: (dateString: string, type: 'holiday' | 'exam' | null) => void;
}

export const useTimetableStore = create<TimetableState>()(
  persist(
    (set, get) => ({
  entries: [],

  addEntry: (data) => {
    const entry: TimetableEntry = {
      id: generateId(),
      subjectId: data.subjectId,
      dayOfWeek: data.dayOfWeek,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      room: data.room || '',
      type: data.type || 'lecture',
      color: data.color,
    };
    set((state) => ({ entries: [...state.entries, entry] }));
    return entry;
  },

  updateEntry: (id, updates) => {
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  },

  removeEntry: (id) => {
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));
  },

  removeEntriesBySubject: (subjectId) => {
    set((state) => ({ entries: state.entries.filter((e) => e.subjectId !== subjectId) }));
  },

  getEntriesForDay: (day) => {
    return get()
      .entries.filter((e) => e.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  },

  loadEntries: (entries) => set({ entries }),
  clearEntries: () => set({ entries: [] }),
  events: {},
  setEvent: (dateString, type) => {
    set((state) => {
      const newEvents = { ...state.events };
      if (type === null) {
        delete newEvents[dateString];
      } else {
        newEvents[dateString] = type;
      }
      return { events: newEvents };
    });
  },
}),
{
  name: 'campora-timetable-storage',
  storage: createJSONStorage(() => zustandStorage),
}
)
);

// Derived hook: get today's classes enriched with subject data
export function useTodayClasses(): TimetableEntryWithSubject[] {
  const entries = useTimetableStore((s) => s.entries);
  const subjects = useSubjectStore((s) => s.subjects);
  const profile = useProfileStore((s) => s.profile);
  const today = getCurrentDayOfWeek();
  const todayDateStr = format(new Date(), 'yyyy-MM-dd');

  return entries
    .filter((e) => {
      if (profile?.semesterStartDate && profile?.semesterEndDate) {
        if (todayDateStr < profile.semesterStartDate || todayDateStr > profile.semesterEndDate) {
          return false;
        }
      }
      return e.dayOfWeek === today;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((entry) => {
      const subject = subjects.find((s) => s.id === entry.subjectId);
      return {
        ...entry,
        subjectName: subject?.name || 'Unknown',
        subjectShortName: subject?.shortName || '??',
        subjectColor: entry.color || subject?.color || '#7C5CFC',
        subjectIcon: subject?.icon,
        faculty: subject?.faculty || '',
      };
    });
}

// Get enriched entries for any day
export function useClassesForDay(day: DayOfWeek): TimetableEntryWithSubject[] {
  const entries = useTimetableStore((s) => s.entries);
  const subjects = useSubjectStore((s) => s.subjects);

  return entries
    .filter((e) => e.dayOfWeek === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((entry) => {
      const subject = subjects.find((s) => s.id === entry.subjectId);
      return {
        ...entry,
        subjectName: subject?.name || 'Unknown',
        subjectShortName: subject?.shortName || '??',
        subjectColor: entry.color || subject?.color || '#7C5CFC',
        subjectIcon: subject?.icon,
        faculty: subject?.faculty || '',
      };
    });
}

// Get enriched entries for a specific date (includes regular weekly classes + extra classes)
export function useClassesForDate(dateString: string, day: DayOfWeek): TimetableEntryWithSubject[] {
  const entries = useTimetableStore((s) => s.entries);
  const events = useTimetableStore((s) => s.events);
  const subjects = useSubjectStore((s) => s.subjects);
  const profile = useProfileStore((s) => s.profile);

  // If the date is marked as a holiday or exam day, return no classes
  if (events[dateString] === 'holiday' || events[dateString] === 'exam') {
    return [];
  }

  // If the date is outside the semester bounds, return no classes
  if (profile?.semesterStartDate && profile?.semesterEndDate) {
    if (dateString < profile.semesterStartDate || dateString > profile.semesterEndDate) {
      return [];
    }
  }

  return entries
    .filter((e) => {
      return e.date === dateString || (!e.date && e.dayOfWeek === day);
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((entry) => {
      const subject = subjects.find((s) => s.id === entry.subjectId);
      return {
        ...entry,
        subjectName: subject?.name || 'Unknown',
        subjectShortName: subject?.shortName || '??',
        subjectColor: entry.color || subject?.color || '#7C5CFC',
        subjectIcon: subject?.icon,
        faculty: subject?.faculty || '',
      };
    });
}
