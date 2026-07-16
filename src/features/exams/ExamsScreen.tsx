// Campora — Exams Screen

import React from 'react';
import { View, Text } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Card, EmptyState } from '@/components/ui';
import { useExamStore, useSubjectStore } from '@/stores';
import { formatDateFull, getCountdown } from '@/lib';

export default function ExamsScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();
  const exams = useExamStore((s) => s.getUpcoming());
  const subjects = useSubjectStore((s) => s.subjects);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing['3xl'], paddingBottom: spacing.lg }}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} onPress={() => router.back()} style={{ marginRight: spacing.md }} />
        <Text style={[textStyles.h2, { color: colors.textPrimary }]}>Exams</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100, gap: spacing.md }}>
        {exams.length === 0 ? (
          <EmptyState icon="school-outline" title="No Exams" subtitle="You have no upcoming exams." />
        ) : (
          exams.map((exam, index) => {
            const subject = subjects.find(s => s.id === exam.subjectId);
            const countdown = getCountdown(exam.date);
            const typeLabel = exam.type.charAt(0).toUpperCase() + exam.type.slice(1);
            
            return (
              <Animated.View key={exam.id} entering={FadeInDown.delay(index * 30).duration(80)}>
                <Card variant="flat" style={{ borderLeftWidth: 4, borderLeftColor: colors.danger }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[textStyles.h3, { color: colors.textPrimary }]}>{subject?.name || 'Exam'}</Text>
                      <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 4 }]}>{typeLabel}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md }}>
                        <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                        <Text style={[textStyles.small, { color: colors.textTertiary }]}>{formatDateFull(exam.date)}</Text>
                      </View>
                      {exam.startTime && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 }}>
                          <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                          <Text style={[textStyles.small, { color: colors.textTertiary }]}>{exam.startTime}</Text>
                        </View>
                      )}
                      {exam.room && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 }}>
                          <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                          <Text style={[textStyles.small, { color: colors.textTertiary }]}>{exam.room}</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ alignItems: 'center', backgroundColor: colors.dangerLight, padding: spacing.md, borderRadius: 12 }}>
                      <Text style={[textStyles.display, { color: colors.danger, fontSize: 24, lineHeight: 28 }]}>{countdown.days}</Text>
                      <Text style={[textStyles.caption, { color: colors.danger, marginTop: 2 }]}>DAYS LEFT</Text>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
