import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
export function WebShell({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <View style={{ flex: 1, backgroundColor: colors.bg, width: '100%', maxWidth: 720, alignSelf: 'center', boxShadow: '0 0 60px #26164712' }}>{children}</View>;
}
