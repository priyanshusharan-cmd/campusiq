import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface SelectProps {
  label: string;
  placeholder: string;
  value?: string;
  required?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  icon?: keyof typeof Ionicons.glyphMap;
  isFocused?: boolean;
}

export function Select({ label, placeholder, value, required, onPress, style, icon = 'chevron-down', isFocused }: SelectProps) {
  const { colors, textStyles } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={[textStyles.smallMedium, { color: colors.textPrimary, marginBottom: 8 }]}>
          {label} {required && <Text style={{ color: colors.danger }}>*</Text>}
        </Text>
      ) : null}
      <Pressable
        onPress={() => {
          Keyboard.dismiss();
          if (onPress) onPress();
        }}
        style={[
          styles.select,
          { 
            backgroundColor: colors.surface,
            borderColor: isFocused ? colors.primary : colors.borderLight,
          }
        ]}
      >
        <Text style={{ flex: 1, fontSize: 15, color: value ? colors.textPrimary : colors.textQuaternary }}>
          {value || placeholder}
        </Text>
        <Ionicons name={icon} size={20} color={isFocused ? colors.primary : colors.textTertiary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
