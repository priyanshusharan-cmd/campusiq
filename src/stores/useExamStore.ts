// Campora — Exam Store (Zustand)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import type { Exam, ExamType, ID } from '@/types';
import { generateId } from '@/types';

interface ExamState {
  exams: Exam[];
  addExam: (data: { subjectId: ID; type: ExamType; date: string; startTime?: string; room?: string; notes?: string; syllabus?: string }) => Exam;
  updateExam: (id: ID, updates: Partial<Exam>) => void;
  removeExam: (id: ID) => void;
  removeExamsBySubject: (subjectId: ID) => void;
  getUpcoming: () => Exam[];
  loadExams: (exams: Exam[]) => void;
  clearExams: () => void;
}

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
  exams: [],

  addExam: (data) => {
    const exam: Exam = {
      id: generateId(),
      subjectId: data.subjectId,
      type: data.type,
      date: data.date,
      startTime: data.startTime,
      room: data.room,
      notes: data.notes,
      syllabus: data.syllabus,
    };
    set((state) => ({ exams: [...state.exams, exam] }));
    return exam;
  },

  updateExam: (id, updates) => {
    set((state) => ({
      exams: state.exams.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  },

  removeExam: (id) => {
    set((state) => ({ exams: state.exams.filter((e) => e.id !== id) }));
  },

  removeExamsBySubject: (subjectId) => {
    set((state) => ({ exams: state.exams.filter((e) => e.subjectId !== subjectId) }));
  },

  getUpcoming: () => {
    const today = new Date().toISOString().split('T')[0];
    return get()
      .exams.filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  loadExams: (exams) => set({ exams }),
  clearExams: () => set({ exams: [] }),
}),
    {
      name: 'exam-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
