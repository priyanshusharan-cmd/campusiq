import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';

interface QuickStatsStripProps {
  cgpa: number; expectedSGPA: number; isSemesterComplete?: boolean;
  attendancePercentage: number; attendanceTotal: number; isBackground?: boolean;
}
export function QuickStatsStrip({ cgpa, expectedSGPA, isSemesterComplete, attendancePercentage, attendanceTotal }: QuickStatsStripProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const stats = [
    { label: 'CGPA', value: cgpa > 0 ? cgpa.toFixed(2) : '—', icon: 'school-outline', color: '#6366F1', route: '/(tabs)/gpa?tab=tracker', hint: 'Overall' },
    { label: isSemesterComplete ? 'SGPA' : 'Expected SGPA', value: expectedSGPA > 0 ? expectedSGPA.toFixed(2) : '—', icon: 'trending-up-outline', color: '#DB2777', route: '/(tabs)/gpa?tab=goals', hint: isSemesterComplete ? 'This semester' : 'SGPA estimate' },
    { label: 'Attendance', value: attendanceTotal > 0 ? `${Math.round(attendancePercentage)}%` : '—', icon: 'shield-checkmark-outline', color: '#059669', route: '/(tabs)/attendance', hint: attendanceTotal > 0 ? `${attendanceTotal} classes` : 'No records yet' },
  ];
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.grid}>{stats.map(stat => <Pressable key={stat.label} accessibilityRole="button" accessibilityLabel={`${stat.label}, ${stat.value}. ${stat.hint}`} onPress={() => router.push(stat.route as any)} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: isDark ? colors.border : 'transparent', opacity: pressed ? 0.75 : 1 }]}>
    <View style={[styles.icon, { backgroundColor: stat.color + (isDark ? '30' : '12') }]}><Ionicons name={stat.icon as any} size={19} color={stat.color} /></View>
    <Text style={[styles.label, { color: colors.textSecondary }]}>{stat.label}</Text>
    <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.value, { color: stat.color }]}>{stat.value}</Text>
    <Text numberOfLines={1} style={[styles.hint, { color: colors.textSecondary }]}>{stat.hint}</Text>
  </Pressable>)}</ScrollView>;
}
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: 22 },
  card: { width: 145, borderRadius: 24, borderWidth: 1, padding: 17, shadowColor: '#334155', shadowOpacity: 0.04, shadowRadius: 14, shadowOffset: { width: 0, height: 5 } },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 5 },
  value: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  hint: { fontSize: 12, marginTop: 9 },
});
