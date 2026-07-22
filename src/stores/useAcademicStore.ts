// Campora — Academic Store (Zustand)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import type { Semester, GradeEntry, GradeLetter, ID, GradeScheme } from '@/types';
import { generateId, DEFAULT_GRADE_SCHEME } from '@/types';
import { gradeToPoint, calcSGPA, calcCGPA } from '@/lib';

interface AcademicState {
  semesters: Semester[];
  gradeEntries: GradeEntry[];
  gradeScheme: GradeScheme;

  // Semester actions
  addSemester: (data: { name: string; number: number; isCurrent?: boolean; sgpa?: number; totalCredits?: number; backlogCount?: number; backlogCredits?: number; sgpaSubjects?: any[] }) => Semester;
  updateSemester: (id: ID, updates: Partial<Semester>) => void;
  removeSemester: (id: ID) => void;
  setCurrentSemester: (id: ID) => void;
  setGradeScheme: (scheme: GradeScheme) => void;

  // Grade actions
  addGradeEntry: (data: { semesterId: ID; subjectId: ID; grade: GradeLetter; credits: number }) => void;
  updateGradeEntry: (id: ID, updates: Partial<GradeEntry>) => void;
  removeGradeEntry: (id: ID) => void;
  removeEntriesBySemester: (semesterId: ID) => void;
  removeEntriesBySubject: (subjectId: ID) => void;

  // Computed
  getSGPA: (semesterId: ID) => number;
  getCGPA: () => number;
  getCurrentSemester: () => Semester | undefined;

  // Bulk
  loadSemesters: (semesters: Semester[]) => void;
  loadGradeEntries: (entries: GradeEntry[]) => void;
  clearAll: () => void;
}

export const useAcademicStore = create<AcademicState>()(
  persist(
    (set, get) => ({
  semesters: [],
  gradeEntries: [],
  gradeScheme: DEFAULT_GRADE_SCHEME,

  addSemester: (data) => {
    const semester: Semester = {
      id: generateId(),
      name: data.name,
      number: data.number,
      isCurrent: data.isCurrent || false,
      sgpa: data.sgpa,
      totalCredits: data.totalCredits,
      backlogCount: data.backlogCount,
      backlogCredits: data.backlogCredits,
      sgpaSubjects: data.sgpaSubjects,
    };
    set((state) => {
      const semesters = data.isCurrent
        ? state.semesters.map((s) => ({ ...s, isCurrent: false }))
        : [...state.semesters];
      return { semesters: [...semesters.filter(s => s.id !== semester.id), semester] };
    });
    return semester;
  },

  updateSemester: (id, updates) => {
    set((state) => ({
      semesters: state.semesters.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  },

  removeSemester: (id) => {
    set((state) => ({
      semesters: state.semesters.filter((s) => s.id !== id),
      gradeEntries: state.gradeEntries.filter((e) => e.semesterId !== id),
    }));
  },

  setCurrentSemester: (id) => {
    set((state) => ({
      semesters: state.semesters.map((s) => ({ ...s, isCurrent: s.id === id })),
    }));
  },

  setGradeScheme: (scheme) => set({ gradeScheme: scheme }),

  addGradeEntry: (data) => {
    const gradeScheme = get().gradeScheme;
    const entry: GradeEntry = {
      id: generateId(),
      semesterId: data.semesterId,
      subjectId: data.subjectId,
      grade: data.grade,
      gradePoint: gradeToPoint(data.grade, gradeScheme),
      credits: data.credits,
    };
    set((state) => ({ gradeEntries: [...state.gradeEntries, entry] }));
  },

  updateGradeEntry: (id, updates) => {
    set((state) => {
      const gradeScheme = state.gradeScheme;
      return {
        gradeEntries: state.gradeEntries.map((e) => {
          if (e.id === id) {
            const updated = { ...e, ...updates };
            if (updates.grade) {
              updated.gradePoint = gradeToPoint(updates.grade, gradeScheme);
            }
            return updated;
          }
          return e;
        }),
      };
    });
  },

  removeGradeEntry: (id) => {
    set((state) => ({ gradeEntries: state.gradeEntries.filter((e) => e.id !== id) }));
  },

  removeEntriesBySemester: (semesterId) => {
    set((state) => ({
      gradeEntries: state.gradeEntries.filter((e) => e.semesterId !== semesterId),
    }));
  },

  removeEntriesBySubject: (subjectId) => {
    set((state) => ({
      gradeEntries: state.gradeEntries.filter((e) => e.subjectId !== subjectId),
      semesters: state.semesters.map((sem) => ({
        ...sem,
        sgpaSubjects: sem.sgpaSubjects?.filter((s) => s.id !== subjectId),
      })),
    }));
  },

  getSGPA: (semesterId) => {
    const entries = get().gradeEntries.filter((e) => e.semesterId === semesterId);
    return calcSGPA(entries);
  },

  getCGPA: () => {
    const { semesters, gradeEntries } = get();
    const semesterData = semesters
      .map((sem) => {
        // First check if grade entries exist for detailed calculation
        const entries = gradeEntries.filter((e) => e.semesterId === sem.id);
        if (entries.length > 0) {
          const sgpa = calcSGPA(entries);
          const credits = entries.reduce((sum, e) => sum + e.credits, 0);
          return { sgpa, credits };
        }
        
        // Otherwise use manual entry if it exists
        if (sem.totalCredits && sem.totalCredits > 0) {
          // Weight for CGPA MUST be total registered credits.
          // Do not subtract backlog credits here, otherwise CGPA inflates incorrectly.
          const credits = sem.totalCredits;
          return { sgpa: sem.sgpa || 0, credits };
        }
        return { sgpa: 0, credits: 0 };
      })
      .filter((s) => s.sgpa >= 0 && s.credits > 0);
    return calcCGPA(semesterData);
  },

  getCurrentSemester: () => get().semesters.find((s) => s.isCurrent),

  loadSemesters: (semesters) => set({ semesters }),
  loadGradeEntries: (entries) => set({ gradeEntries: entries }),
  clearAll: () => set({ semesters: [], gradeEntries: [] }),
}),
    {
      name: 'academic-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
