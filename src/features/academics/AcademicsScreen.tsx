// Campora — Academics Screen

import React from 'react';
import { View, Text, Alert, Pressable, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { Card, SectionHeader, EmptyState, ListRow } from '@/components/ui';
import { useAcademicStore, useProfileStore } from '@/stores';
import { getGPALabel } from '@/lib';

export default function AcademicsScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();
  const cgpa = useAcademicStore((s) => s.getCGPA());
  const semesters = useAcademicStore((s) => s.semesters);
  const getSGPA = useAcademicStore((s) => s.getSGPA);
  const profile = useProfileStore((s) => s.profile);
  const currentSem = profile?.currentSemester || 1;

  const semesterCards = React.useMemo(() => {
    const realSemesters = [...semesters];
    const realSemNumbers = new Set(realSemesters.map(s => s.number));
    
    // Generate dummy cards for all semesters up to currentSem
    const semestersCount = Math.max(1, currentSem);
    
    for (let i = 1; i <= semestersCount; i++) {
      if (!realSemNumbers.has(i)) {
        realSemesters.push({
          id: `dummy-${i}`,
          name: `Semester ${i}`,
          number: i,
          sgpa: 0,
          totalCredits: 0,
        } as any);
      }
    }
    
    // Set isCurrent correctly for both real and dummy cards
    return realSemesters.map(s => ({
      ...s,
      isCurrent: s.number === currentSem
    })).sort((a, b) => a.number - b.number);
  }, [currentSem, semesters]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing['3xl'], paddingBottom: spacing.lg }}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} onPress={() => router.back()} style={{ marginRight: spacing.md }} />
        <Text style={[textStyles.h2, { color: colors.textPrimary }]}>Grades & SGPA</Text>
      </View>

      <Animated.View entering={FadeInDown.delay(20).duration(100)} style={{ paddingHorizontal: spacing.xl }}>
        <Card style={{ alignItems: 'center', paddingVertical: spacing['3xl'] }}>
          <Text style={[textStyles.h3, { color: colors.textSecondary }]}>Cumulative GPA</Text>
          <Text style={[textStyles.display, { color: colors.primary, fontSize: 48, marginTop: spacing.sm }]}>
            {cgpa > 0 ? cgpa.toFixed(2) : '—'}
          </Text>
        </Card>
      </Animated.View>


      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: spacing.sm }}>
        <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Semesters</Text>
      </View>
      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
        {semesterCards.length === 0 ? (
          <EmptyState icon="school-outline" title="No Semesters Added" subtitle="Add your past grades to track your CGPA." />
        ) : (
          semesterCards.map((sem, index) => {
            const sgpa = getSGPA(sem.id);
            return (
                <Animated.View key={sem.id} entering={FadeInDown.delay(40 + index * 20).duration(100)} style={styles.cardContainer}>
                  <Pressable 
                    onPress={() => router.push(`/(modals)/semester-sgpa?semNumber=${sem.number}` as any)}
                    onLongPress={() => {
                      Alert.alert(
                        "Delete Semester",
                        `Are you sure you want to delete ${sem.name}?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          { 
                            text: "Delete", 
                            style: "destructive", 
                            onPress: () => useAcademicStore.getState().removeSemester(sem.id) 
                          }
                        ]
                      );
                    }}
                  >
                    <LinearGradient colors={['#8B5CF6', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientCard}>
                      <View style={styles.semesterSelector}>
                        <Text style={[textStyles.smallMedium, { color: 'rgba(255,255,255,0.8)' }]}>Semester {sem.number}</Text>
                        {sem.isCurrent && (
                          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>CURRENT</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.cardContent}>
                        <View>
                          <Text style={[textStyles.small, { color: 'rgba(255,255,255,0.8)', marginBottom: 4 }]}>SGPA</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[textStyles.display, { color: '#FFF', fontSize: 36, lineHeight: 40 }]}>{(sgpa > 0) ? sgpa.toFixed(2) : '--'}</Text>
                          </View>
                          {(sgpa > 0) ? (
                            <View style={styles.tag}>
                              <Text style={[textStyles.smallMedium, { color: '#FFF', fontSize: 10 }]}>{getGPALabel(sgpa)}</Text>
                            </View>
                          ) : null}
                        </View>

                        <View style={{ alignItems: 'flex-end', flex: 1, justifyContent: 'center' }}>
                          <Text style={[textStyles.small, { color: 'rgba(255,255,255,0.8)', marginBottom: 4 }]}>Credits Evaluated</Text>
                          <Text style={[textStyles.h3, { color: '#FFF', marginBottom: 8 }]}>{sem.totalCredits || 0}</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
            );
          })
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  cardContainer: { shadowColor: '#7C5CFC', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  gradientCard: { borderRadius: 20, padding: 20, minHeight: 160 },
  semesterSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 20 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between' },
  tag: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 8, alignSelf: 'flex-start' },
});
