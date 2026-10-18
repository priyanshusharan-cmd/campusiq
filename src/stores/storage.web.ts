import type { StateStorage } from 'zustand/middleware';
type Listener = (operation: 'get' | 'set' | 'remove', name: string, error: unknown) => void;
let listener: Listener | null = null;
const memory = new Map<string, string>();
export function setStorageErrorListener(fn: Listener | null) { listener = fn; }
// No window access during Expo's static rendering. In restricted browsers retain
// an in-memory session and explain failed persistence through the existing UI.
export const zustandStorage: StateStorage = {
  async getItem(name) {
    if (typeof window === 'undefined') return null;
    try { return window.localStorage.getItem(name) ?? memory.get(name) ?? null; }
    catch (error) { listener?.('get', name, error); return memory.get(name) ?? null; }
  },
  async setItem(name, value) {
    if (typeof window === 'undefined') return;
    memory.set(name, value);
    try { window.localStorage.setItem(name, value); }
    catch (error) { listener?.('set', name, error); }
  },
  async removeItem(name) {
    memory.delete(name);
    if (typeof window === 'undefined') return;
    try { window.localStorage.removeItem(name); }
    catch (error) { listener?.('remove', name, error); }
  },
};
