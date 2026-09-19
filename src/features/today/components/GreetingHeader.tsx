// Campora — GreetingHeader Component
// Time-aware greeting updated for new design (sits below navbar)

import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { getGreeting, getGreetingEmoji } from '@/lib';

interface GreetingHeaderProps {
  firstName: string;
}

export function GreetingHeader({ firstName }: GreetingHeaderProps) {
  const { colors, spacing, textStyles, isDark } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.delay(0).duration(100)}
      style={{
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
      }}
    >
      <Text style={[textStyles.h1, { color: isDark ? '#FFFFFF' : colors.textPrimary, fontFamily: 'Inter-Bold', letterSpacing: -0.5 }]}>
        {getGreeting()}, {firstName}! {getGreetingEmoji()}
      </Text>
      <Text style={[textStyles.body, { color: isDark ? 'rgba(255,255,255,0.7)' : colors.textSecondary, marginTop: 4 }]}>
        Let&apos;s make today productive.
      </Text>
    </Animated.View>
  );
}
