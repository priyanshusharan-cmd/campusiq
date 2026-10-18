// Campora — EmptyState Component

import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function EmptyState({ icon = 'sparkles-outline', title, subtitle, style }: EmptyStateProps) {
  const { colors, spacing, textStyles } = useTheme();

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing['5xl'], paddingHorizontal: spacing['3xl'] }, style]}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg }}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={[textStyles.h3, { color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm }]}>{title}</Text>
      {subtitle && (
        <Text style={[textStyles.body, { color: colors.textTertiary, textAlign: 'center', maxWidth: 280 }]}>{subtitle}</Text>
      )}
    </View>
  );
}
