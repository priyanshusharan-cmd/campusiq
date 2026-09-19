// Campora — Shadow System
// Platform-aware shadows for iOS and Android

import { Platform, type ViewStyle } from 'react-native';

interface ShadowConfig {
  ios: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
  };
  android: {
    elevation: number;
  };
}

const shadowConfigs: Record<string, ShadowConfig> = {
  none: {
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0 },
    android: { elevation: 0 },
  },
  xs: {
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
    android: { elevation: 1 },
  },
  sm: {
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
    android: { elevation: 2 },
  },
  md: {
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
    android: { elevation: 4 },
  },
  lg: {
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24 },
    android: { elevation: 8 },
  },
  xl: {
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.12, shadowRadius: 48 },
    android: { elevation: 16 },
  },
};

export function getShadow(size: keyof typeof shadowConfigs): ViewStyle {
  const config = shadowConfigs[size];
  if (Platform.OS === 'ios') {
    return config.ios;
  }
  return config.android;
}

// Brand glow shadow (for primary elements)
export function getGlowShadow(color: string = '#7C5CFC'): ViewStyle {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
    };
  }
  return { elevation: 8 };
}

export const shadows = {
  none: getShadow('none'),
  xs: getShadow('xs'),
  sm: getShadow('sm'),
  md: getShadow('md'),
  lg: getShadow('lg'),
  xl: getShadow('xl'),
} as const;
