// Campora — QuickStatsStrip Component
// A horizontal scrolling list of quick statistic cards on the Home Screen

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useDrawerStore } from '@/stores';

interface QuickStatsStripProps {
  cgpa: number;
  expectedSGPA: number;
  attendancePercentage: number;
  attendanceTotal: number;
  isBackground?: boolean;
}

export function QuickStatsStrip({ cgpa, expectedSGPA, attendancePercentage, attendanceTotal, isBackground = false }: QuickStatsStripProps) {
  const { colors, spacing, textStyles, isDark } = useTheme();
  const router = useRouter();
  const homeStatsScrollX = useDrawerStore(s => s.homeStatsScrollX);
  const setHomeStatsScrollX = useDrawerStore(s => s.setHomeStatsScrollX);

  return (
    <Animated.View entering={isBackground ? undefined : FadeInDown.delay(20).duration(100)}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 12, paddingBottom: spacing.md }}
        contentOffset={{ x: isBackground ? homeStatsScrollX : 0, y: 0 }}
        onScroll={isBackground ? undefined : (e) => setHomeStatsScrollX(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
        scrollEnabled={!isBackground}
      >
        {/* CGPA Card */}
        <Pressable 
          style={[styles.card, !isDark && styles.cardLight]}
          onPress={() => router.push('/(tabs)/gpa?tab=tracker' as any)}
        >
          <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.15)' : colors.primaryLight }]}>
            <Ionicons name="school-outline" size={20} color={isDark ? "#818CF8" : colors.primary} />
          </View>
          <Text style={[textStyles.smallMedium, { color: isDark ? '#FFFFFF' : colors.textPrimary, marginTop: 16 }]}>CGPA</Text>
          <Text style={[textStyles.display, { color: isDark ? '#818CF8' : colors.primary, fontSize: 32, marginVertical: 4, textShadowColor: isDark ? 'rgba(129, 140, 248, 0.3)' : 'transparent', textShadowOffset: {width: 0, height: 2}, textShadowRadius: isDark ? 8 : 0 }]}>
            {cgpa > 0 ? cgpa.toFixed(2) : '--'}
          </Text>
          <View style={styles.footerRow}>
            <Text style={[textStyles.small, { color: isDark ? 'rgba(255,255,255,0.6)' : colors.textSecondary }]}>View Tracker</Text>
            <Ionicons name="chevron-forward" size={12} color={isDark ? "rgba(255,255,255,0.4)" : colors.textTertiary} style={{ marginLeft: 2 }} />
          </View>
        </Pressable>

        {/* Expected SGPA Card */}
        <Pressable 
          style={[styles.card, !isDark && styles.cardLight]}
          onPress={() => router.push('/(tabs)/gpa?tab=goals' as any)}
        >
          <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(244, 114, 182, 0.15)' : '#FCE7F3' }]}>
            <Ionicons name="sparkles" size={20} color={isDark ? "#F472B6" : '#DB2777'} />
          </View>
          <Text style={[textStyles.smallMedium, { color: isDark ? '#FFFFFF' : colors.textPrimary, marginTop: 16 }]}>Expected SGPA</Text>
          <Text style={[textStyles.display, { color: isDark ? '#F472B6' : '#DB2777', fontSize: 32, marginVertical: 4, textShadowColor: isDark ? 'rgba(244, 114, 182, 0.3)' : 'transparent', textShadowOffset: {width: 0, height: 2}, textShadowRadius: isDark ? 8 : 0 }]}>
            {expectedSGPA > 0 ? expectedSGPA.toFixed(2) : '--'}
          </Text>
          <View style={styles.footerRow}>
            <Text style={[textStyles.small, { color: isDark ? 'rgba(255,255,255,0.6)' : colors.textSecondary }]}>View Goals</Text>
            <Ionicons name="chevron-forward" size={12} color={isDark ? "rgba(255,255,255,0.4)" : colors.textTertiary} style={{ marginLeft: 2 }} />
          </View>
        </Pressable>

        {/* Attendance Card */}
        <Pressable 
          style={[styles.card, !isDark && styles.cardLight]}
          onPress={() => router.push('/(tabs)/attendance' as any)}
        >
          <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : colors.successLight }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={isDark ? "#34D399" : colors.success} />
          </View>
          <Text style={[textStyles.smallMedium, { color: isDark ? '#FFFFFF' : colors.textPrimary, marginTop: 16 }]}>Attendance</Text>
          <Text style={[textStyles.display, { color: isDark ? '#34D399' : colors.success, fontSize: 32, marginVertical: 4, textShadowColor: isDark ? 'rgba(52, 211, 153, 0.3)' : 'transparent', textShadowOffset: {width: 0, height: 2}, textShadowRadius: isDark ? 8 : 0 }]}>
            {attendancePercentage}%
          </Text>
          <View style={styles.footerRow}>
            <Text style={[textStyles.small, { color: isDark ? 'rgba(255,255,255,0.6)' : colors.textSecondary }]}>View Details</Text>
            <Ionicons name="chevron-forward" size={12} color={isDark ? "rgba(255,255,255,0.4)" : colors.textTertiary} style={{ marginLeft: 2 }} />
          </View>
        </Pressable>

      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 145,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
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
