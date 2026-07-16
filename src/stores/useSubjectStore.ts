// Campora — Subject Store (Zustand)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Subject, ID, SubjectType } from '@/types';
import { generateId, generateShortName } from '@/types';
import { colorFromString } from '@/theme';
import { zustandStorage } from './storage';

interface SubjectState {
  subjects: Subject[];
  addSubject: (data: { name: string; code?: string; faculty?: string; room?: string; type?: SubjectType; credits?: number; semesterId?: string }) => Subject;
  updateSubject: (id: ID, updates: Partial<Subject>) => void;
  removeSubject: (id: ID) => void;
  getSubject: (id: ID) => Subject | undefined;
  loadSubjects: (subjects: Subject[]) => void;
  clearSubjects: () => void;
}

export const useSubjectStore = create<SubjectState>()(
  persist(
    (set, get) => ({
      subjects: [],

  addSubject: (data) => {
    const subject: Subject = {
      id: generateId(),
      name: data.name,
      code: data.code || '',
      shortName: generateShortName(data.name),
      faculty: data.faculty || '',
      room: data.room || '',
      color: colorFromString(data.name),
      type: data.type || 'theory',
      credits: data.credits || 3,
      semesterId: data.semesterId || '',
      createdAt: new Date(),
    };
    set((state) => ({ subjects: [...state.subjects, subject] }));
    return subject;
  },

  updateSubject: (id, updates) => {
    set((state) => ({
      subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  },

  removeSubject: (id) => {
    set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id) }));
    
    // Cascade delete related records
    const { useTimetableStore } = require('./useTimetableStore');
    const { useAttendanceStore } = require('./useAttendanceStore');
    const { useAssignmentStore } = require('./useAssignmentStore');
    const { useExamStore } = require('./useExamStore');
    
    useTimetableStore.getState().removeEntriesBySubject(id);
    useAttendanceStore.getState().removeRecordsBySubject(id);
    useAssignmentStore.getState().removeAssignmentsBySubject(id);
    useExamStore.getState().removeExamsBySubject(id);
  },

  getSubject: (id) => get().subjects.find((s) => s.id === id),

  loadSubjects: (subjects) => set({ subjects }),

  clearSubjects: () => set({ subjects: [] }),
    }),
    {
      name: 'subject-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
