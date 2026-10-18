import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from '@/platform/router';
import { useTheme } from '@/theme';
import { useActiveSubjects, useTimetableStore } from '@/stores';
import { DAY_NAMES } from '@/types';
import { formatTime } from '@/lib';

export default function ClassesScreen() {
  const { colors, textStyles } = useTheme();
  const router = useRouter();
  const subjects = useActiveSubjects();
  const entries = useTimetableStore(state => state.entries);
  const groups = [...subjects].sort((a, b) => a.name.localeCompare(b.name)).map(subject => ({ subject,
    classes: entries.filter(entry => entry.subjectId === subject.id).sort((a, b) => {
      if (!!a.date !== !!b.date) return a.date ? 1 : -1;
      return (a.date && b.date ? a.date.localeCompare(b.date) : a.dayOfWeek - b.dayOfWeek) || a.startTime.localeCompare(b.startTime);
    }),
  }));
  const count = groups.reduce((total, group) => total + group.classes.length, 0);
  const addClass = (subjectId?: string) => router.push((subjectId ? `/(modals)/create-class?subjectId=${encodeURIComponent(subjectId)}` : '/(modals)/create-class') as any);
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.button}><Ionicons name="arrow-back" size={25} color={colors.textPrimary} /></Pressable>
      <View style={{ flex: 1 }}><Text style={[textStyles.h2, { color: colors.textPrimary }]}>Classes</Text><Text style={[textStyles.small, { color: colors.textSecondary, marginTop: 3 }]}>{count} {count === 1 ? 'class' : 'classes'} · {subjects.length} subjects</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Add class" onPress={() => addClass()} style={[styles.button, { backgroundColor: colors.primaryLight, borderRadius: 16 }]}><Ionicons name="add" size={27} color={colors.primary} /></Pressable>
    </View>
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 50 }}>
      <Text style={[textStyles.small, { color: colors.textSecondary, marginBottom: 20 }]}>Current semester · Grouped by subject. Tap a class to edit.</Text>
      {!groups.length && <View style={styles.empty}><Ionicons name="calendar-outline" size={42} color={colors.primary} /><Text style={[textStyles.h3, { color: colors.textPrimary, marginTop: 16 }]}>Your classes start here</Text><Text style={[textStyles.small, { color: colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>Add subjects first, then create or import your timetable.</Text><Pressable onPress={() => router.push('/academics/subjects' as any)} style={[styles.link, { backgroundColor: colors.primaryLight }]}><Text style={{ color: colors.primary, fontWeight: '600' }}>Open Subjects</Text></Pressable></View>}
      {groups.map(({ subject, classes }) => <View key={subject.id} style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.subjectHeader, { borderBottomColor: colors.divider, borderBottomWidth: classes.length ? 1 : 0 }]}>
          <View style={[styles.dot, { backgroundColor: subject.color || colors.primary }]} />
          <View style={{ flex: 1 }}><Text style={[textStyles.bodySemiBold, { color: colors.textPrimary }]}>{subject.name}</Text><Text style={[textStyles.small, { color: colors.textSecondary, marginTop: 4 }]}>{[subject.code, `${classes.length} ${classes.length === 1 ? 'class' : 'classes'}`].filter(Boolean).join(' · ')}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Add class for ${subject.name}`} onPress={() => addClass(subject.id)} style={styles.button}><Ionicons name="add-circle-outline" size={25} color={colors.primary} /></Pressable>
        </View>
        {!classes.length && <Text style={[textStyles.small, { color: colors.textSecondary, paddingHorizontal: 18, paddingBottom: 18 }]}>No classes scheduled.</Text>}
        {classes.map((entry, index) => <Pressable key={entry.id} accessibilityRole="button" onPress={() => router.push(`/(modals)/create-class?editId=${encodeURIComponent(entry.id)}` as any)} style={[styles.classRow, { borderBottomColor: colors.divider, borderBottomWidth: index < classes.length - 1 ? 1 : 0 }]}>
          <View style={{ flex: 1 }}><Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>{entry.date ? `${entry.date} · ${DAY_NAMES[entry.dayOfWeek]}` : `Every ${DAY_NAMES[entry.dayOfWeek]}`}</Text><Text style={[textStyles.small, { color: colors.textSecondary, marginTop: 6 }]}>{formatTime(entry.startTime)} – {formatTime(entry.endTime)}</Text><Text style={[textStyles.small, { color: colors.textSecondary, marginTop: 5 }]}>{[entry.type === 'lab' ? 'Lab' : 'Lecture', entry.room, subject.faculty].filter(Boolean).join(' · ')}</Text></View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>)}
      </View>)}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 },
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  group: { borderRadius: 22, borderWidth: 1, marginBottom: 18, overflow: 'hidden' },
  subjectHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  dot: { width: 5, height: 36, borderRadius: 4 },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  empty: { paddingVertical: 60, alignItems: 'center' },
  link: { marginTop: 20, padding: 14, borderRadius: 14 },
});
