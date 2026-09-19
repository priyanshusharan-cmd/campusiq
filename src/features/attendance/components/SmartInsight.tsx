// Campora — SmartInsight Component (Attendance)
// Simple horizontal banner with an icon and message

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface SmartInsightProps {
  message: string;
}

export function SmartInsight({ message }: SmartInsightProps) {
  const { colors, textStyles } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.primaryLight }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
        <Ionicons name="trending-up" size={18} color={colors.primary} />
      </View>
      <Text style={[textStyles.small, { color: colors.textSecondary, flex: 1, lineHeight: 18 }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 20,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
});
