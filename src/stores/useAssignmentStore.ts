// Campora — Assignment Store (Zustand)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import type { Assignment, AssignmentStatus, ID, Priority } from '@/types';
import { generateId } from '@/types';
import { isOverdue } from '@/lib';

interface AssignmentState {
  assignments: Assignment[];
  addAssignment: (data: { title: string; subjectId: ID; dueDate: string; priority?: Priority; notes?: string }) => Assignment;
  updateAssignment: (id: ID, updates: Partial<Assignment>) => void;
  toggleComplete: (id: ID) => void;
  removeAssignment: (id: ID) => void;
  removeAssignmentsBySubject: (subjectId: ID) => void;
  getByStatus: (status: AssignmentStatus) => Assignment[];
  getPending: () => Assignment[];
  getOverdue: () => Assignment[];
  loadAssignments: (assignments: Assignment[]) => void;
  clearAssignments: () => void;
}

export const useAssignmentStore = create<AssignmentState>()(
  persist(
    (set, get) => ({
  assignments: [],

  addAssignment: (data) => {
    const assignment: Assignment = {
      id: generateId(),
      title: data.title,
      subjectId: data.subjectId,
      dueDate: data.dueDate,
      priority: data.priority || 'medium',
      status: 'pending',
      notes: data.notes,
      createdAt: new Date(),
    };
    set((state) => ({ assignments: [...state.assignments, assignment] }));
    return assignment;
  },

  updateAssignment: (id, updates) => {
    set((state) => ({
      assignments: state.assignments.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  },

  toggleComplete: (id) => {
    set((state) => ({
      assignments: state.assignments.map((a) => {
        if (a.id !== id) return a;
        const isCompleting = a.status !== 'completed';
        return {
          ...a,
          status: isCompleting ? 'completed' as const : 'pending' as const,
          completedAt: isCompleting ? new Date() : undefined,
        };
      }),
    }));
  },

  removeAssignment: (id) => {
    set((state) => ({ assignments: state.assignments.filter((a) => a.id !== id) }));
  },

  removeAssignmentsBySubject: (subjectId) => {
    set((state) => ({ assignments: state.assignments.filter((a) => a.subjectId !== subjectId) }));
  },

  getByStatus: (status) => get().assignments.filter((a) => a.status === status),

  getPending: () => {
    return get().assignments.filter((a) => {
      if (a.status === 'completed') return false;
      if (isOverdue(a.dueDate)) return true;
      return a.status === 'pending';
    });
  },

  getOverdue: () => {
    return get().assignments.filter(
      (a) => a.status !== 'completed' && isOverdue(a.dueDate)
    );
  },

  loadAssignments: (assignments) => set({ assignments }),
  clearAssignments: () => set({ assignments: [] }),
}),
    {
      name: 'assignment-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
