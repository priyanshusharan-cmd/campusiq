// Campora — Typography System
// Inter font family with consistent type scale

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const fontSize = {
  display: 32,
  h1: 24,
  h2: 20,
  h3: 17,
  body: 15,
  bodySmall: 14,
  small: 13,
  caption: 11,
  micro: 10,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

export const lineHeight = {
  display: 38,
  h1: 30,
  h2: 26,
  h3: 22,
  body: 22,
  bodySmall: 20,
  small: 18,
  caption: 14,
  micro: 12,
} as const;

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const;

// Pre-composed text styles
export const textStyles = {
  display: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.display,
    lineHeight: lineHeight.display,
    letterSpacing: letterSpacing.tight,
  },
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.h1,
    lineHeight: lineHeight.h1,
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.h2,
    lineHeight: lineHeight.h2,
  },
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.h3,
    lineHeight: lineHeight.h3,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
  },
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
  },
  bodySemiBold: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
  },
  small: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.small,
    lineHeight: lineHeight.small,
  },
  smallMedium: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.small,
    lineHeight: lineHeight.small,
  },
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase' as const,
  },
} as const;
