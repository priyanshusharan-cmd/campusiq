import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { APP_WIDTH } from './webLayout';

export function WebShell({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <View style={{ flex: 1, width: '100%', backgroundColor: colors.bgSecondary }}>
    <style>{`
      /* Native Modal portals live outside the app root. Keep their layout at
         the same phone width as the screens behind them on desktop browsers. */
      [aria-modal="true"] { max-width: ${APP_WIDTH}px; margin-left: auto; margin-right: auto; }
    `}</style>
    <View testID="mobile-app-frame" style={{ flex: 1, width: '100%', maxWidth: APP_WIDTH, minHeight: 0, alignSelf: 'center', overflow: 'hidden', backgroundColor: colors.bg }}>
      {children}
    </View>
  </View>;
}
