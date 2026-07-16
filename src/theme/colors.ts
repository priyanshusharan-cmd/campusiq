// Campora — Color Palette
// Auto-generated subject colors and complete light/dark theme tokens

export const palette = {
  // Brand
  violet: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#7C5CFC',
    600: '#654BE1',
    700: '#5338C9',
    800: '#4328A4',
    900: '#362180',
  },

  // Semantic
  emerald: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  rose: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
  },
  sky: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
  },

  // Neutrals
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  white: '#FFFFFF',
  black: '#000000',
} as const;

// Subject colors — visually distinct, harmonious palette
export const subjectColors = [
  '#7C5CFC', // Violet
  '#0EA5E9', // Sky blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#F43F5E', // Rose
  '#06B6D4', // Cyan
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
] as const;

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Backgrounds
  bg: string;
  bgSecondary: string;
  surface: string;
  surfaceHover: string;
  surfaceElevated: string;

  // Borders
  border: string;
  borderLight: string;
  divider: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textQuaternary: string;
  textOnPrimary: string;

  // Constants
  white: string;
  black: string;

  // Brand
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Semantic
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  info: string;
  infoLight: string;

  // Tab bar
  tabBar: string;
  tabBarBorder: string;
}

export const lightColors: ThemeColors = {
  bg: palette.slate[50],
  bgSecondary: '#F1F2F6',
  surface: palette.white,
  surfaceHover: palette.violet[50],
  surfaceElevated: palette.white,

  border: palette.slate[200],
  borderLight: palette.slate[100],
  divider: palette.slate[100],

  textPrimary: palette.slate[900],
  textSecondary: palette.slate[500],
  textTertiary: palette.slate[400],
  textQuaternary: palette.slate[300],
  textOnPrimary: palette.white,

  white: palette.white,
  black: palette.black,

  primary: palette.violet[500],
  primaryLight: palette.violet[50],
  primaryDark: palette.violet[700],

  success: palette.emerald[500],
  successLight: palette.emerald[50],
  warning: palette.amber[500],
  warningLight: palette.amber[50],
  danger: palette.rose[500],
  dangerLight: palette.rose[50],
  info: palette.sky[500],
  infoLight: palette.sky[50],

  tabBar: palette.white,
  tabBarBorder: palette.slate[200],
};

export const darkColors: ThemeColors = {
  bg: '#0B0D14',
  bgSecondary: '#12141D',
  surface: '#161822',
  surfaceHover: '#1E2030',
  surfaceElevated: '#1A1C28',

  border: '#2A2D3A',
  borderLight: '#1F2130',
  divider: '#1F2130',

  textPrimary: '#F1F3F9',
  textSecondary: '#8B8FA7',
  textTertiary: '#5C6078',
  textQuaternary: '#3D4055',
  textOnPrimary: palette.white,

  white: palette.white,
  black: palette.black,

  primary: '#9B7FFF',
  primaryLight: '#1E1535',
  primaryDark: '#7C5CFC',

  success: '#34D399',
  successLight: '#0D2818',
  warning: '#FBBF24',
  warningLight: '#2A1F0A',
  danger: '#FB7185',
  dangerLight: '#2A0D14',
  info: '#38BDF8',
  infoLight: '#0A1F2A',

  tabBar: '#12141D',
  tabBarBorder: '#1F2130',
};

// Get color for subject based on index
export function getSubjectColor(index: number): string {
  return subjectColors[index % subjectColors.length];
}

// Generate color from string hash (for auto-assigning subject colors)
export function colorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % subjectColors.length;
  return subjectColors[index];
}
