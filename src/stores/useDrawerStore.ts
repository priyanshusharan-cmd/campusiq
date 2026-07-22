import { create } from 'zustand';

interface DrawerState {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  setDrawerOpen: (isOpen: boolean) => void;
  homeScrollY: number;
  setHomeScrollY: (y: number) => void;
  homeStatsScrollX: number;
  setHomeStatsScrollX: (x: number) => void;
}

export const useDrawerStore = create<DrawerState>((set) => ({
  isOpen: false,
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
  setDrawerOpen: (isOpen) => set({ isOpen }),
  homeScrollY: 0,
  setHomeScrollY: (y) => set({ homeScrollY: y }),
  homeStatsScrollX: 0,
  setHomeStatsScrollX: (x) => set({ homeStatsScrollX: x }),
}));
