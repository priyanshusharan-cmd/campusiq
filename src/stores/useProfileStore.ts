// Campora — Profile Store (Zustand)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ID } from '@/types';
import { generateId } from '@/types';
import { zustandStorage } from './storage';

export interface Profile {
  id: ID;
  name: string;
  enrollmentNumber: string;
  college: string;
  branch: string;
  currentSemester: number;
  avatarUri?: string;
  email?: string;
  phone?: string;
  dob?: string;
  address?: string;
  section?: string;
  academicYear?: string;
  semesterStartDate?: string;
  semesterEndDate?: string;
  totalSemesters?: number;
  totalCredits?: number;
}

interface ProfileState {
  profile: Profile | null;
  setProfile: (profile: Partial<Profile>) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,

      setProfile: (data) => {
        set({
          profile: {
            id: generateId(),
            name: data.name || '',
            enrollmentNumber: data.enrollmentNumber || '',
            college: data.college || '',
            branch: data.branch || '',
            currentSemester: data.currentSemester || 1,
            avatarUri: data.avatarUri,
            email: data.email,
            phone: data.phone,
            dob: data.dob,
            address: data.address,
            section: data.section,
            academicYear: data.academicYear,
            semesterStartDate: data.semesterStartDate,
            semesterEndDate: data.semesterEndDate,
            totalSemesters: data.totalSemesters,
            totalCredits: data.totalCredits,
          },
        });
      },

      updateProfile: (updates) => {
        const { profile } = get();
        if (!profile) return;
        set({ profile: { ...profile, ...updates } });
      },

      clearProfile: () => set({ profile: null }),
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
