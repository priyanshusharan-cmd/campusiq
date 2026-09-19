import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/theme';

const DEFAULT_COLORS = ['#10B981', '#6366F1', '#3B82F6', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6', '#EF4444'];

interface ColorPickerProps {
  label?: string;
  colors?: string[];
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label = 'Color', colors = DEFAULT_COLORS, value, onChange }: ColorPickerProps) {
  const { colors: themeColors, textStyles } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[textStyles.smallMedium, { color: themeColors.textPrimary, marginBottom: 12 }]}>{label}</Text>
      <View style={styles.colorsRow}>
        {colors.map((color) => {
          const isSelected = value === color;
          return (
            <Pressable
              key={color}
              onPress={() => onChange(color)}
              style={[
                styles.colorOuter,
                isSelected && { borderColor: color, backgroundColor: color + '20' }
              ]}
            >
              <View style={[styles.colorInner, { backgroundColor: color }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
  }
});
