import { StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type StorageErrorListener = (operation: 'get' | 'set' | 'remove', name: string, error: unknown) => void;
let errorListener: StorageErrorListener | null = null;
export function setStorageErrorListener(fn: StorageErrorListener | null) {
  errorListener = fn;
}

export const zustandStorage: StateStorage = {
  setItem: async (name, value) => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch (e) {
      console.warn('AsyncStorage setItem error:', e);
      errorListener?.('set', name, e);
    }
  },
  getItem: async (name) => {
    try {
      const value = await AsyncStorage.getItem(name);
      return value ?? null;
    } catch (e) {
      console.warn('AsyncStorage getItem error:', e);
      errorListener?.('get', name, e);
      return null;
    }
  },
  removeItem: async (name) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (e) {
      console.warn('AsyncStorage removeItem error:', e);
      errorListener?.('remove', name, e);
    }
  },
};

