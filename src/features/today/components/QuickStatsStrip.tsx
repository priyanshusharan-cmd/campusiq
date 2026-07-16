// Campora — QuickStatsStrip Component
// A horizontal scrolling list of quick statistic cards on the Home Screen

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';

interface QuickStatsStripProps {
  cgpa: number;
  attendancePercentage: number;
  attendanceTotal: number;
  todayClassCount: number;
}

export function QuickStatsStrip({ cgpa, attendancePercentage, attendanceTotal, todayClassCount }: QuickStatsStripProps) {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();

  return (
    <Animated.View entering={FadeInDown.delay(20).duration(100)}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 12, paddingBottom: spacing.md }}
      >
        {/* CGPA Card */}
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
            {/* The icon in the image has axes and a trend line. stats-chart-outline is a good fallback in Ionicons */}
            <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
          </View>
          <Text style={[textStyles.smallMedium, { color: colors.textPrimary, marginTop: 16 }]}>CGPA</Text>
          <Text style={[textStyles.display, { color: colors.primary, fontSize: 32, marginVertical: 4 }]}>
            {cgpa.toFixed(2)}
          </Text>
          <View style={styles.footerRow}>
            <Text style={[textStyles.small, { color: colors.textSecondary }]}>Good Job!</Text>
            <Ionicons name="trending-up" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
          </View>
        </View>

        {/* Attendance Card */}
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: colors.successLight }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
          </View>
          <Text style={[textStyles.smallMedium, { color: colors.textPrimary, marginTop: 16 }]}>Attendance</Text>
          <Text style={[textStyles.display, { color: colors.success, fontSize: 32, marginVertical: 4 }]}>
            {attendancePercentage}%
          </Text>
          <View style={styles.footerRow}>
            <Text style={[textStyles.small, { color: colors.textSecondary }]}>Above Target</Text>
            <Ionicons name="trending-up" size={14} color={colors.success} style={{ marginLeft: 4 }} />
          </View>
        </View>

        {/* Today's Classes Card */}
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: colors.infoLight }]}>
            <Ionicons name="calendar-outline" size={20} color={colors.info} />
          </View>
          <Text style={[textStyles.smallMedium, { color: colors.textPrimary, marginTop: 16 }]}>Today&apos;s Classes</Text>
          <Text style={[textStyles.display, { color: colors.info, fontSize: 32, marginVertical: 4 }]}>
            {todayClassCount}
          </Text>
          <View style={styles.footerRow}>
            <Pressable style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push('/(tabs)/timetable' as any)}>
              <Text style={[textStyles.small, { color: colors.textSecondary }]}>View Timetable</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.textTertiary} style={{ marginLeft: 2 }} />
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  }
});
