// Campora — ListRow Component

import React from 'react';
import { View, Text, Pressable, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface ListRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  rightText?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  style?: ViewStyle;
  iconBackgroundColor?: string;
}

export function ListRow({
  icon,
  iconColor,
  title,
  subtitle,
  rightText,
  rightElement,
  onPress,
  showChevron = true,
  style,
  iconBackgroundColor,
}: ListRowProps) {
  const { colors, spacing, textStyles, radius } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          backgroundColor: pressed ? colors.surfaceHover : 'transparent',
        },
        style,
      ]}
    >
      {icon && (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.sm,
            backgroundColor: iconBackgroundColor || colors.bgSecondary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing.md,
          }}
        >
          <Ionicons name={icon} size={18} color={iconColor || colors.textSecondary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle && (
          <Text style={[textStyles.small, { color: colors.textTertiary, marginTop: 2 }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightText && (
        <Text style={[textStyles.small, { color: colors.textTertiary, marginRight: spacing.sm }]}>
          {rightText}
        </Text>
      )}
      {rightElement}
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={16} color={colors.textQuaternary} />
      )}
    </Pressable>
  );
}
