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
  const { colors, spacing, textStyles } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.delay(0).duration(100)}
      style={{
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
      }}
    >
      <Text style={[textStyles.h1, { color: colors.textPrimary }]}>
        {getGreeting()}, {firstName}! {getGreetingEmoji()}
      </Text>
      <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 4 }]}>
        Let&apos;s make today productive.
      </Text>
    </Animated.View>
  );
}
