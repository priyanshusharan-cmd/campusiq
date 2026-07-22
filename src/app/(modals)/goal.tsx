import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Modal, TextInput, ScrollView, ActionSheetIOS, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '@/theme';
import { useSettingsStore, useAcademicStore, useProfileStore, useSubjectStore, useActiveSubjects } from '@/stores';
import { getGPALabel, calculateRequiredExternals, calculateAggregatedInternal } from '@/lib';
import { convertLegacyToComponents, calculateSubjectBounds, getGradeBoundary } from '@/lib/gradingEngine';
import { DEFAULT_GRADE_SCHEME, GradeScheme, GradeBoundary } from '@/types/grading';

const { width } = Dimensions.get('window');

export default function GoalScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();

  const settings = useSettingsStore();
  const profile = useProfileStore(s => s.profile);
  const gradeScheme = useAcademicStore(s => s.gradeScheme);
  const setGradeScheme = useAcademicStore(s => s.setGradeScheme);

  const currentSemNum = profile?.currentSemester || 1;

  // SGPA Predictor Data
  const currentSubjects = useActiveSubjects();
  
  const maxAchievableSGPA = useMemo(() => {
    let totalPoints = 0;
    let totalCredits = 0;
    currentSubjects.forEach(s => {
      totalCredits += s.credits;
      const comps = s.components && s.components.length > 0 ? s.components : convertLegacyToComponents(s.cieMarks, s.aatMarks, s.labInternalMarks, settings, s.type === 'lab');
      const bounds = calculateSubjectBounds(comps, {});
      const maxPossible = comps.reduce((sum, c) => sum + (c.type === 'grouped' ? c.weight : c.maxMarks), 0) || 100;
      const percentage = Math.round((bounds.ceiling / maxPossible) * 100);
      const boundary = getGradeBoundary(gradeScheme, percentage);
      totalPoints += boundary.gradePoints * s.credits;
    });
    return totalCredits > 0 ? (totalPoints / totalCredits) : 10.0;
  }, [currentSubjects, gradeScheme, settings]);

  const [targetSGPA, setTargetSGPA] = useState(Math.min(9.0, maxAchievableSGPA));

  const predictedResults = useMemo(() => {
    const inputData = currentSubjects.map(s => {
      // Use new dynamic components if available, else legacy logic
      let aggregatedInternal = 0;
      if (s.components && s.components.length > 0) {
        aggregatedInternal = s.components.filter(c => c.id !== 'legacy-see').reduce((acc, c) => acc + (c.earnedMarks || 0), 0);
      } else {
        aggregatedInternal = calculateAggregatedInternal(s, settings);
      }
      
      return {
        id: s.id,
        type: s.type,
        internalMarks: aggregatedInternal,
        labMarks: s.labMarks || 0,
        credits: s.credits
      };
    });
    return calculateRequiredExternals(inputData, targetSGPA, settings);
  }, [currentSubjects, targetSGPA, settings]);



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSecondary }} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.borderLight }]} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[textStyles.h3, { color: colors.textPrimary }]}>GPA Goals</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 60, paddingTop: spacing.md }} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(20).duration(80)}>
            
            <Animated.View entering={FadeInDown.delay(40).duration(100)}>
              <LinearGradient colors={['#8B5CF6', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.targetCard}>
                <View style={styles.glassBadge}>
                  <Text style={[textStyles.smallMedium, { color: '#FFF' }]}>Semester {currentSemNum} Target</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 16 }}>
                  <Pressable onPress={() => setTargetSGPA(prev => Math.max(4, prev - 0.5))} style={styles.adjustBtn}>
                    <Ionicons name="remove" size={24} color={colors.primary} />
                  </Pressable>
                  <Text style={[textStyles.display, { color: '#FFF', fontSize: 56, lineHeight: 64, marginHorizontal: 32, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 8 }]}>
                    {targetSGPA.toFixed(1)}
                  </Text>
                  <Pressable onPress={() => setTargetSGPA(prev => {
                    const next = prev + 0.5;
                    return next > maxAchievableSGPA ? maxAchievableSGPA : next;
                  })} style={styles.adjustBtn}>
                    <Ionicons name="add" size={24} color={colors.primary} />
                  </Pressable>
                </View>
                <Text style={[textStyles.smallMedium, { color: 'rgba(255,255,255,0.8)', textAlign: 'center', paddingHorizontal: 16 }]}>
                  Tune your dream SGPA to calculate exactly what you need in the final exams.
                </Text>
                <View style={{ backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'center', marginTop: 12, marginBottom: 8 }}>
                  <Text style={[textStyles.smallMedium, { color: '#FFF' }]}>
                    Max Achievable: {maxAchievableSGPA.toFixed(2)} SGPA
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>



            <View style={{ marginTop: 32, marginBottom: 16 }}>
              <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Subject Goals</Text>
            </View>
            
            {currentSubjects.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <View style={[styles.emptyIconBg, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="book-outline" size={32} color={colors.primary} />
                </View>
                <Text style={[textStyles.bodyMedium, { color: colors.textSecondary, marginTop: 12, textAlign: 'center' }]}>No subjects found for Semester {currentSemNum}.</Text>
              </View>
            ) : (
              currentSubjects.map((sub, idx) => {
                const prediction = predictedResults.find(p => p.subjectId === sub.id);
                const required = prediction?.requiredExternal || 0;
                const isImpossible = required > (sub.type === 'lab' ? settings.labMaxExternalMarks : settings.maxExternalMarks);
                
                return (
                  <Pressable key={sub.id} onPress={() => router.push({ pathname: '/(modals)/subject-detail', params: { id: sub.id } })}>
                    <Animated.View entering={FadeInDown.delay(60 + idx * 20).duration(100)} style={[styles.subjectRow, { backgroundColor: colors.surface }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                          <Text style={[textStyles.bodySemiBold, { color: colors.textPrimary, marginBottom: 6, fontSize: 16 }]} numberOfLines={1}>{sub.name}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.badge, { backgroundColor: sub.color + '20', paddingHorizontal: 6, paddingVertical: 2 }]}>
                              <Text style={{ color: sub.color, fontSize: 10, fontWeight: 'bold' }}>{sub.shortName}</Text>
                            </View>
                            <Text style={[textStyles.small, { color: colors.textSecondary, marginLeft: 8 }]}>{sub.credits} Credits</Text>
                          </View>
                          <View style={{ marginTop: 12, backgroundColor: colors.bg, padding: 8, borderRadius: 12, alignSelf: 'flex-start' }}>
                            <Text style={[textStyles.smallMedium, { color: colors.textSecondary }]}>
                              Internal Marks: {sub.components ? sub.components.filter(c => c.id !== 'legacy-see').reduce((acc, c) => acc + (c.earnedMarks || 0), 0) : calculateAggregatedInternal(sub, settings)}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                          <Text style={[textStyles.small, { color: colors.textSecondary, marginBottom: 6 }]}>Need in SEE</Text>
                          <View style={[styles.requiredBadge, { backgroundColor: isImpossible ? colors.danger + '15' : colors.primaryLight }]}>
                            <Text style={[textStyles.h2, { color: isImpossible ? colors.danger : colors.primary }]}>
                              {isImpossible ? 'N/A' : required}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Animated.View>
                  </Pressable>
                );
              })
            )}
            
            <View style={{ marginTop: 16, padding: 16, backgroundColor: colors.primaryLight, borderRadius: 12 }}>
              <Text style={[textStyles.small, { color: colors.primary, textAlign: 'center', lineHeight: 20 }]}>
                N/A means it is mathematically impossible to hit this target SGPA with your current internal marks.
              </Text>
            </View>
          </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingItem({ icon, iconColor, title, value, colors, textStyles, isValueSub = false, onPress }: any) {
  return (
    <Pressable style={styles.settingItem} onPress={onPress}>
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={{ flex: 1, flexDirection: isValueSub ? 'column' : 'row', justifyContent: isValueSub ? 'center' : 'space-between', alignItems: isValueSub ? 'flex-start' : 'center' }}>
        <Text style={[textStyles.bodyMedium, { color: colors.textPrimary, marginBottom: isValueSub ? 4 : 0 }]}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[isValueSub ? textStyles.small : textStyles.bodyMedium, { color: colors.textSecondary, marginRight: 8 }]} numberOfLines={1}>
            {value}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textQuaternary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  segmentContainer: { flexDirection: 'row', padding: 4, borderRadius: 12 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  
  targetCard: { borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12, marginTop: 12 },
  glassBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 8 },
  adjustBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  
  emptyState: { borderWidth: 1, borderRadius: 20, padding: 32, alignItems: 'center', borderStyle: 'dashed' },
  emptyIconBg: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  
  subjectRow: { borderRadius: 24, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2 },
  scoreInput: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, fontWeight: '700', width: 60, textAlign: 'center' },
  requiredBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, alignItems: 'center' },
  
  cardContainer: { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  gradientCard: { borderRadius: 20, padding: 24 },
  badge: { borderRadius: 12, alignSelf: 'center' },
  editBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  progressBarBg: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3 },
  progressBarFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 3 },
  chartCard: { borderRadius: 20, borderWidth: 1, padding: 16, paddingBottom: 20, alignItems: 'center' },
  settingsCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  divider: { height: 1, marginLeft: 64 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 24, padding: 24 },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, minHeight: 48, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 32 },
  modalBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }
});
