// Campora — SectionHeader Component

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  const { colors, spacing, textStyles } = useTheme();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing['2xl'], paddingBottom: spacing.md }}>
      <Text style={[textStyles.h3, { color: colors.textPrimary }]}>{title}</Text>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[textStyles.smallMedium, { color: colors.primary }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}
