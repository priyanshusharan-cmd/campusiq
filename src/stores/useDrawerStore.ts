import { create } from 'zustand';

interface DrawerState {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  setDrawerOpen: (isOpen: boolean) => void;
}

export const useDrawerStore = create<DrawerState>((set) => ({
  isOpen: false,
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
  setDrawerOpen: (isOpen) => set({ isOpen }),
}));
