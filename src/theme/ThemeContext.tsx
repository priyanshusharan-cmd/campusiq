// Campora — Theme Context
// Provides theme colors and mode to entire app

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type ThemeColors, type ThemeMode } from './colors';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { spacing, radius, iconSize, componentHeight } from './spacing';
import { textStyles, fontFamily, fontSize } from './typography';
import { shadows, getShadow, getGlowShadow } from './shadows';

export interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  iconSize: typeof iconSize;
  componentHeight: typeof componentHeight;
  textStyles: typeof textStyles;
  fontFamily: typeof fontFamily;
  fontSize: typeof fontSize;
  shadows: typeof shadows;
  getShadow: typeof getShadow;
  getGlowShadow: typeof getGlowShadow;
  isDark: boolean;
  toggleTheme: () => void;
}

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const mode = useSettingsStore((s) => s.theme);
  const accentColor = useSettingsStore((s) => s.accentColor);
  const setMode = useSettingsStore((s) => s.setTheme);

  const isDark = useMemo(() => {
    if (mode === 'system') return systemScheme === 'dark';
    return mode === 'dark';
  }, [mode, systemScheme]);

  const toggleTheme = useCallback(() => {
    setMode(isDark ? 'light' : 'dark');
  }, [isDark, setMode]);

  const theme: Theme = useMemo(() => {
    const baseColors = isDark ? darkColors : lightColors;
    
    // We only need to override if it's different from the default primary
    const activeColors = { ...baseColors };
    
    if (accentColor && accentColor !== '#7C5CFC') {
      activeColors.primary = accentColor;
    }
    
    return {
      colors: activeColors,
      spacing,
      radius,
      iconSize,
      componentHeight,
      textStyles,
      fontFamily,
      fontSize,
      shadows,
      getShadow,
      getGlowShadow,
      isDark,
      toggleTheme,
    };
  }, [isDark, toggleTheme, accentColor]);

  const contextValue = useMemo(
    () => ({ theme, mode, setMode, toggleTheme }),
    [theme, mode, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context.theme;
}

export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
}
