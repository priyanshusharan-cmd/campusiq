// Campora — Attendance Store (Zustand)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AttendanceRecord, AttendanceStatus, SubjectAttendance, ID } from '@/types';
import { generateId, getAttendanceStatus } from '@/types';
import { calcAttendancePercentage, calcCanMiss, calcNeedToAttend, getPastScheduledClasses } from '@/lib/attendanceUtils';
import { useSubjectStore } from './useSubjectStore';
import { useSettingsStore } from './useSettingsStore';
import { useTimetableStore } from './useTimetableStore';
import { useProfileStore } from './useProfileStore';
import { zustandStorage } from './storage';

interface AttendanceState {
  records: AttendanceRecord[];
  markAttendance: (subjectId: ID, date: string, status: AttendanceStatus, timetableEntryId?: ID) => void;
  updateRecord: (id: ID, status: AttendanceStatus) => void;
  removeRecord: (id: ID) => void;
  removeRecordsBySubject: (subjectId: ID) => void;
  removeRecordsByDate: (date: string) => void;
  getRecordsBySubject: (subjectId: ID) => AttendanceRecord[];
  getRecordsByDate: (date: string) => AttendanceRecord[];
  hasRecordForEntry: (date: string, timetableEntryId: ID) => boolean;
  markBulkAttendance: (date: string, status: AttendanceStatus) => void;
  markDayAsHoliday: (date: string) => void;
  markDayAsExam: (date: string) => void;
  loadRecords: (records: AttendanceRecord[]) => void;
  clearRecords: () => void;
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
  records: [],

  markAttendance: (subjectId, date, status, timetableEntryId) => {
    // Check if already marked for this entry on this date
    const existing = get().records.find(
      (r) => r.subjectId === subjectId && r.date === date && r.timetableEntryId === timetableEntryId
    );

    if (existing) {
      // Update existing record
      set((state) => ({
        records: state.records.map((r) =>
          r.id === existing.id ? { ...r, status, markedAt: new Date() } : r
        ),
      }));
    } else {
      // Create new record
      const record: AttendanceRecord = {
        id: generateId(),
        subjectId,
        date,
        status,
        timetableEntryId,
        markedAt: new Date(),
      };
      set((state) => ({ records: [...state.records, record] }));
    }
  },

  updateRecord: (id, status) => {
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id ? { ...r, status, markedAt: new Date() } : r
      ),
    }));
  },

  removeRecord: (id) => {
    set((state) => ({ records: state.records.filter((r) => r.id !== id) }));
  },

  removeRecordsBySubject: (subjectId) => {
    set((state) => ({ records: state.records.filter((r) => r.subjectId !== subjectId) }));
  },

  removeRecordsByDate: (date) => {
    set((state) => ({ records: state.records.filter((r) => r.date !== date) }));
  },

  getRecordsBySubject: (subjectId) => {
    return get().records.filter((r) => r.subjectId === subjectId);
  },

  getRecordsByDate: (date) => {
    return get().records.filter((r) => r.date === date);
  },

  hasRecordForEntry: (date, timetableEntryId) => {
    return get().records.some((r) => r.date === date && r.timetableEntryId === timetableEntryId);
  },

  // Mark attendance for ALL subjects that have timetable entries on the given date's day-of-week
  markBulkAttendance: (date, status) => {
    const { useTimetableStore } = require('./useTimetableStore');
    const { useSubjectStore } = require('./useSubjectStore');
    const entries = useTimetableStore.getState().entries;
    const subjects = useSubjectStore.getState().subjects;

    // Determine day of week from the date string
    const d = new Date(date + 'T12:00:00');
    const jsDay = d.getDay(); // 0=Sun
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Mon format

    // Find all timetable entries for this day of week
    const dayEntries = entries.filter((e: any) => e.dayOfWeek === dayOfWeek);

    // For each entry, mark attendance
    dayEntries.forEach((entry: any) => {
      const subject = subjects.find((s: any) => s.id === entry.subjectId);
      if (subject) {
        get().markAttendance(entry.subjectId, date, status, entry.id);
      }
    });
  },

  // Mark a day as holiday for all subjects + set timetable event
  markDayAsHoliday: (date) => {
    const { useTimetableStore } = require('./useTimetableStore');
    const entries = useTimetableStore.getState().entries;

    // Set the timetable event
    useTimetableStore.getState().setEvent(date, 'holiday');

    // Determine day of week from the date string
    const d = new Date(date + 'T12:00:00');
    const jsDay = d.getDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

    // Find all timetable entries for this day of week
    const dayEntries = entries.filter((e: any) => e.dayOfWeek === dayOfWeek);

    // Mark holiday for each entry's subject
    dayEntries.forEach((entry: any) => {
      get().markAttendance(entry.subjectId, date, 'holiday', entry.id);
    });
  },

  // Mark a day as exam for all subjects + set timetable event
  markDayAsExam: (date) => {
    const { useTimetableStore } = require('./useTimetableStore');
    const entries = useTimetableStore.getState().entries;

    // Set the timetable event
    useTimetableStore.getState().setEvent(date, 'exam');

    // Determine day of week from the date string
    const d = new Date(date + 'T12:00:00');
    const jsDay = d.getDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

    // Find all timetable entries for this day of week
    const dayEntries = entries.filter((e: any) => e.dayOfWeek === dayOfWeek);

    // Mark cancelled for each entry's subject
    dayEntries.forEach((entry: any) => {
      get().markAttendance(entry.subjectId, date, 'cancelled', entry.id);
    });
  },

  loadRecords: (records) => set({ records }),

  clearRecords: () => set({ records: [] }),
}),
    {
      name: 'attendance-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

// Derived hook: get subject-wise attendance summary
export function useSubjectAttendance(): SubjectAttendance[] {
  const records = useAttendanceStore((s) => s.records);
  const subjects = useSubjectStore((s) => s.subjects);
  const target = useSettingsStore((s) => s.attendanceTarget);
  const timetableEntries = useTimetableStore((s) => s.entries);
  const events = useTimetableStore((s) => s.events);
  const profile = useProfileStore((s) => s.profile);

  return subjects.map((subject) => {
    const subjectRecords = records.filter((r) => r.subjectId === subject.id);
    const explicitPresent = subjectRecords.filter((r) => r.status === 'present').length;
    const absent = subjectRecords.filter((r) => r.status === 'absent').length;
    const cancelled = subjectRecords.filter((r) => r.status === 'cancelled').length;
    const holiday = subjectRecords.filter((r) => r.status === 'holiday').length;

    // Calculate Assumed Present
    const pastScheduled = getPastScheduledClasses(subject.id, timetableEntries, events, profile?.semesterStartDate);
    let assumedPresent = 0;
    
    for (const scheduled of pastScheduled) {
      const hasRecord = subjectRecords.some(r => r.date === scheduled.dateStr && r.timetableEntryId === scheduled.entryId);
      if (!hasRecord) assumedPresent++;
    }

    const present = explicitPresent + assumedPresent;
    const totalClasses = present + absent; // Only count present + absent for percentage
    const percentage = calcAttendancePercentage(present, totalClasses);
    
    // Subject specific target falls back to global target
    const effectiveTarget = subject.attendanceTarget ?? target;
    
    const canMiss = calcCanMiss(present, totalClasses, effectiveTarget);
    const needToAttend = calcNeedToAttend(present, totalClasses, effectiveTarget);

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      subjectShortName: subject.shortName,
      subjectColor: subject.color,
      totalClasses,
      present,
      absent,
      cancelled,
      holiday,
      percentage,
      canMiss,
      needToAttend,
      target: effectiveTarget,
      status: getAttendanceStatus(percentage, effectiveTarget),
    };
  });
}

// Get overall attendance
export function useOverallAttendance() {
  const subjectStats = useSubjectAttendance();
  const target = useSettingsStore((s) => s.attendanceTarget);

  const present = subjectStats.reduce((sum, s) => sum + s.present, 0);
  const absent = subjectStats.reduce((sum, s) => sum + s.absent, 0);
  const total = present + absent;
  const percentage = calcAttendancePercentage(present, total);
  const canMiss = calcCanMiss(present, total, target);

  return { present, absent, total, percentage, canMiss };
}
