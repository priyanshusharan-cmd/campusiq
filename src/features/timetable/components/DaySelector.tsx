// Campora — DaySelector Component
// Horizontal scrollable list of days to filter timetable

import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView as NativeScrollView } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import type { DayOfWeek } from '@/types';

interface DayItem {
  index: DayOfWeek;
  label: string;
  dateText?: string;
  isToday: boolean;
}

interface DaySelectorProps {
  days: DayItem[];
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
}

export function DaySelector({ days, selectedDay, onSelectDay }: DaySelectorProps) {
  const { colors, spacing, textStyles, isDark } = useTheme();
  const scrollRef = useRef<NativeScrollView>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ x: Math.max(0, selectedDay - 2) * 77, animated: true }); }, [selectedDay]);

  return (
    <Animated.View entering={FadeInDown.delay(20).duration(100)}>
      <ScrollView
        ref={scrollRef}
        onLayout={() => scrollRef.current?.scrollTo({ x: Math.max(0, selectedDay - 2) * 77, animated: false })}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 12, paddingBottom: spacing.lg }}
      >
        {days.map((day) => {
          const isSelected = day.index === selectedDay;
          return (
            <Pressable
              key={day.index}
              onPress={() => onSelectDay(day.index)}
              style={({ pressed }) => [
                styles.dayCard,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  opacity: pressed ? 0.9 : 1,
                  shadowColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  textStyles.bodyMedium,
                  { color: isSelected ? colors.white : colors.textPrimary },
                ]}
              >
                {day.label}
              </Text>
              {day.dateText && (
                <Text
                  style={[
                    textStyles.small,
                    { 
                      color: isSelected ? colors.primaryLight : (isDark ? '#D1D5DB' : colors.textSecondary),
                      marginTop: 2 
                    },
                  ]}
                >
                  {day.dateText}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dayCard: {
    width: 65,
    height: 70,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
