import { StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const zustandStorage: StateStorage = {
  setItem: async (name, value) => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch (e) {
      console.warn('AsyncStorage setItem error:', e);
    }
  },
  getItem: async (name) => {
    try {
      const value = await AsyncStorage.getItem(name);
      return value ?? null;
    } catch (e) {
      console.warn('AsyncStorage getItem error:', e);
      return null;
    }
  },
  removeItem: async (name) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (e) {
      console.warn('AsyncStorage removeItem error:', e);
    }
  },
};

