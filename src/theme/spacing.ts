// Campora — Spacing System
// Consistent spacing and border radius tokens

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// Consistent icon sizes
export const iconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
  '3xl': 40,
} as const;

// Common component heights
export const componentHeight = {
  buttonSm: 36,
  buttonMd: 44,
  buttonLg: 52,
  input: 48,
  listItem: 56,
  tabBar: 80,
  topBar: 56,
  chip: 32,
  badge: 22,
} as const;
