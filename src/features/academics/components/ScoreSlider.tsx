import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '@/theme';

interface ScoreSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onValueChange: (val: number) => void;
  step?: number;
}

export function ScoreSlider({ label, value, min, max, onValueChange, step = 1 }: ScoreSliderProps) {
  const { colors, fontFamily } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textSecondary, fontFamily: fontFamily.medium }]}>
          {label}
        </Text>
        <Text style={[styles.value, { color: colors.textPrimary, fontFamily: fontFamily.semiBold }]}>
          {Math.round(value)} / {max}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
