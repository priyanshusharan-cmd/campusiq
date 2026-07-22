// Campora — Subject Store (Zustand)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Subject, ID, SubjectType } from '@/types';
import { generateId, generateShortName } from '@/types';
import { colorFromString } from '@/theme';
import { zustandStorage } from './storage';
import { useProfileStore } from './useProfileStore';

import type { AssessmentComponent } from '@/types/grading';

import { useAcademicStore } from './useAcademicStore';

interface SubjectState {
  subjects: Subject[];
  addSubject: (data: { name: string; code?: string; faculty?: string; room?: string; type?: SubjectType; credits?: number; semesterId?: string; components?: AssessmentComponent[]; color?: string; icon?: string }) => Subject;
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
      color: data.color || colorFromString(data.name),
      icon: data.icon,
      type: data.type || 'theory',
      credits: data.credits || 3,
      semesterId: data.semesterId || '',
      components: data.components,
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
    const { useAcademicStore } = require('./useAcademicStore');
    
    useTimetableStore.getState().removeEntriesBySubject(id);
    useAttendanceStore.getState().removeRecordsBySubject(id);
    useAssignmentStore.getState().removeAssignmentsBySubject(id);
    useExamStore.getState().removeExamsBySubject(id);
    useAcademicStore.getState().removeEntriesBySubject(id);
  },

  getSubject: (id) => get().subjects.find((s) => s.id === id),

  loadSubjects: (subjects) => set({ subjects }),

  clearSubjects: () => set({ subjects: [] }),
    }),
    {
      name: 'subject-storage',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        
        // Migrate: Normalize all semesterId values to just the number string
        let needsUpdate = false;
        const migrated = state.subjects.map(s => {
          let normalizedId = s.semesterId;
          
          // Fix "sem-X" format → "X"
          if (normalizedId && normalizedId.startsWith('sem-')) {
            normalizedId = normalizedId.replace('sem-', '');
            needsUpdate = true;
          }
          
          // Fix empty semesterId → "4" (legacy subjects were created in semester 4)
          if (!normalizedId || normalizedId.trim() === '') {
            normalizedId = '4';
            needsUpdate = true;
          }
          
          // Fix UUID-style semesterIds — check if it's NOT a pure number
          if (normalizedId && isNaN(parseInt(normalizedId))) {
            const academicSemesters = useAcademicStore.getState().semesters;
            const academicSem = academicSemesters.find(
              (sem) => sem.id === normalizedId
            );
            normalizedId = academicSem ? academicSem.number.toString() : '1';
            needsUpdate = true;
          }
          
          return { ...s, semesterId: normalizedId };
        });
        
        if (needsUpdate) {
          // Use setTimeout to avoid setting state during rehydration
          setTimeout(() => {
            useSubjectStore.setState({ subjects: migrated });
          }, 0);
        }

        // Auto-populate: If grade tracker has subjects for the current semester but SubjectStore doesn't,
        // create them in SubjectStore
        setTimeout(() => {
          const profile = useProfileStore.getState().profile;
          const currentSemNum = profile?.currentSemester || 1;
          const semStr = currentSemNum.toString();
          const currentSubjects = useSubjectStore.getState().subjects.filter(s => s.semesterId === semStr);
          
          if (currentSubjects.length === 0) {
            // No subjects in SubjectStore for current semester — check grade tracker
            const academicSemesters = useAcademicStore.getState().semesters;
            const currentAcademicSem = academicSemesters.find((s: any) => s.number === currentSemNum);
            
            if (currentAcademicSem?.sgpaSubjects && currentAcademicSem.sgpaSubjects.length > 0) {
              const state = useSubjectStore.getState();
              currentAcademicSem.sgpaSubjects.forEach((sgpaSub: any) => {
                if (!sgpaSub.name || !sgpaSub.name.trim()) return;
                state.addSubject({
                  name: sgpaSub.name,
                  code: sgpaSub.code || '',
                  credits: parseFloat(sgpaSub.credits) || 3,
                  semesterId: semStr,
                });
              });
            }
          }
        }, 100); // Slight delay to ensure all stores are rehydrated
      },
    }
  )
);

// Returns subjects for the CURRENT semester only (based on profile.currentSemester)
export const useActiveSubjects = () => {
  const subjects = useSubjectStore(s => s.subjects);
  const profile = useProfileStore(s => s.profile);
  const currentSemNum = profile?.currentSemester || 1;
  const currentSemStr = currentSemNum.toString();
  
  // ONLY return subjects whose semesterId matches the current semester number string
  return subjects.filter(s => s.semesterId === currentSemStr);
};

// Returns subjects for a SPECIFIC semester number (used by grade tracker)
export const useSubjectsForSemester = (semesterNumber: number) => {
  const subjects = useSubjectStore(s => s.subjects);
  return subjects.filter(s => s.semesterId === semesterNumber.toString());
};
