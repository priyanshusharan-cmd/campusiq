// Campora — OverviewCards Component (Attendance)
// Horizontal scrollable stats cards for attendance

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface OverviewCardsProps {
  percentage: number;
  attended: number;
  missed: number;
  total: number;
  canMiss: number;
}

export function OverviewCards({ percentage, attended, missed, total, canMiss }: OverviewCardsProps) {
  const { colors, spacing, textStyles, isDark } = useTheme();

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 12, paddingBottom: spacing.sm, paddingTop: 4 }}
    >
      {/* Overall Attendance */}
      <View style={[styles.card, !isDark && styles.cardLight]}>
        <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : colors.successLight }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={isDark ? "#34D399" : colors.success} />
        </View>
        <Text style={[textStyles.smallMedium, { color: isDark ? '#FFFFFF' : colors.textPrimary, marginTop: 16 }]}>Overall</Text>
        <Text style={[textStyles.display, { color: isDark ? '#34D399' : colors.success, fontSize: 32, marginVertical: 4, textShadowColor: isDark ? 'rgba(52, 211, 153, 0.3)' : 'transparent', textShadowOffset: {width: 0, height: 2}, textShadowRadius: isDark ? 8 : 0 }]}>
          {percentage > 0 ? `${percentage.toFixed(0)}%` : '—'}
        </Text>
        <View style={styles.footerRow}>
          <Text style={[textStyles.small, { color: isDark ? 'rgba(255,255,255,0.6)' : colors.textSecondary }]}>
            {percentage >= 85 ? 'Above Target' : 'Below Target'}
          </Text>
          <Ionicons name={percentage >= 85 ? "trending-up" : "trending-down"} size={14} color={percentage >= 85 ? (isDark ? "#34D399" : colors.success) : (isDark ? "#F87171" : colors.danger)} style={{ marginLeft: 4 }} />
        </View>
      </View>

      {/* Classes Attended */}
      <View style={[styles.card, !isDark && styles.cardLight]}>
        <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : colors.infoLight }]}>
          <Ionicons name="checkmark-circle-outline" size={20} color={isDark ? "#38BDF8" : colors.info} />
        </View>
        <Text style={[textStyles.smallMedium, { color: isDark ? '#FFFFFF' : colors.textPrimary, marginTop: 16 }]}>Attended</Text>
        <Text style={[textStyles.display, { color: isDark ? '#38BDF8' : colors.info, fontSize: 32, marginVertical: 4, textShadowColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'transparent', textShadowOffset: {width: 0, height: 2}, textShadowRadius: isDark ? 8 : 0 }]}>
          {attended}
        </Text>
        <View style={styles.footerRow}>
          <Text style={[textStyles.small, { color: isDark ? 'rgba(255,255,255,0.6)' : colors.textSecondary }]}>
            Out of {total} classes
          </Text>
        </View>
      </View>

      {/* Classes Missed */}
      <View style={[styles.card, !isDark && styles.cardLight]}>
        <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(248, 113, 113, 0.15)' : colors.dangerLight }]}>
          <Ionicons name="close-circle-outline" size={20} color={isDark ? "#F87171" : colors.danger} />
        </View>
        <Text style={[textStyles.smallMedium, { color: isDark ? '#FFFFFF' : colors.textPrimary, marginTop: 16 }]}>Missed</Text>
        <Text style={[textStyles.display, { color: isDark ? '#F87171' : colors.danger, fontSize: 32, marginVertical: 4, textShadowColor: isDark ? 'rgba(248, 113, 113, 0.3)' : 'transparent', textShadowOffset: {width: 0, height: 2}, textShadowRadius: isDark ? 8 : 0 }]}>
          {missed}
        </Text>
        <View style={styles.footerRow}>
          <Text style={[textStyles.small, { color: isDark ? 'rgba(255,255,255,0.6)' : colors.textSecondary }]}>
            Out of {total} classes
          </Text>
        </View>
      </View>

      {/* You can miss */}
      <View style={[styles.card, !isDark && styles.cardLight]}>
        <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.15)' : colors.primaryLight }]}>
          <Ionicons name="battery-charging-outline" size={20} color={isDark ? "#818CF8" : colors.primary} />
        </View>
        <Text style={[textStyles.smallMedium, { color: isDark ? '#FFFFFF' : colors.textPrimary, marginTop: 16 }]}>Can Miss</Text>
        <Text style={[textStyles.display, { color: isDark ? '#818CF8' : colors.primary, fontSize: 32, marginVertical: 4, textShadowColor: isDark ? 'rgba(129, 140, 248, 0.3)' : 'transparent', textShadowOffset: {width: 0, height: 2}, textShadowRadius: isDark ? 8 : 0 }]}>
          {canMiss > 0 ? canMiss : 0}
        </Text>
        <View style={styles.footerRow}>
          <Text style={[textStyles.small, { color: isDark ? 'rgba(255,255,255,0.6)' : colors.textSecondary }]}>
            More classes
          </Text>
        </View>
      </View>
    </ScrollView>
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
