import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { useAcademicStore, useProfileStore } from '@/stores';
import { getGPALabel } from '@/lib';

const { width } = Dimensions.get('window');

export default function SGPAEntryScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();
  
  const semesters = useAcademicStore(s => s.semesters);
  const cgpa = useAcademicStore(s => s.getCGPA());
  const profile = useProfileStore(s => s.profile);

  const currentSem = profile?.currentSemester || 1;
  const semesterCards = useMemo(() => {
    return Array.from({ length: currentSem }, (_, i) => {
      const semNum = i + 1;
      const existingSem = semesters.find(s => s.number === semNum);
      return existingSem || {
        id: `dummy-${semNum}`,
        name: `Semester ${semNum}`,
        number: semNum,
        sgpa: 0,
        totalCredits: 0
      };
    });
  }, [currentSem, semesters]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSecondary }} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.borderLight }]} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[textStyles.h3, { color: colors.textPrimary }]}>SGPA</Text>
        <View style={styles.cgpaPill}>
          <Text style={[textStyles.smallMedium, { color: colors.primary, fontSize: 12 }]}>CGPA: {cgpa > 0 ? cgpa.toFixed(2) : '--'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
        {semesterCards.map((sem, index) => (
          <Animated.View key={sem.id} entering={FadeInDown.delay(20 + index * 40).duration(80)} style={[styles.cardContainer, { marginBottom: 16 }]}>
            <Pressable onPress={() => router.push({ pathname: '/(modals)/semester-sgpa', params: { semNumber: sem.number }})}>
              <LinearGradient colors={['#8B5CF6', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientCard}>
                <View style={styles.semesterSelector}>
                  <Text style={[textStyles.smallMedium, { color: 'rgba(255,255,255,0.8)' }]}>{sem.name}</Text>
                </View>

                <View style={styles.cardContent}>
                  <View>
                    <Text style={[textStyles.small, { color: 'rgba(255,255,255,0.8)', marginBottom: 4 }]}>SGPA</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[textStyles.display, { color: '#FFF', fontSize: 36, lineHeight: 40 }]}>{(sem.sgpa && sem.sgpa > 0) ? sem.sgpa.toFixed(2) : '--'}</Text>
                    </View>
                    {(sem.sgpa && sem.sgpa > 0) ? (
                      <View style={styles.tag}>
                        <Text style={[textStyles.smallMedium, { color: '#FFF', fontSize: 10 }]}>{getGPALabel(sem.sgpa)}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={{ alignItems: 'flex-end', flex: 1, justifyContent: 'center' }}>
                    <Text style={[textStyles.small, { color: 'rgba(255,255,255,0.8)', marginBottom: 4 }]}>Credits Evaluated</Text>
                    <Text style={[textStyles.h3, { color: '#FFF', marginBottom: 8 }]}>{sem.totalCredits || 0} Crs</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cardContainer: { shadowColor: '#7C5CFC', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  gradientCard: { borderRadius: 20, padding: 20, minHeight: 160 },
  semesterSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 20 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between' },
  tag: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 8, alignSelf: 'flex-start' },
  cgpaPill: { backgroundColor: '#F5F3FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
});

