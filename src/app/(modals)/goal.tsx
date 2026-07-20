import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Modal, TextInput, ScrollView, ActionSheetIOS, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '@/theme';
import { useSettingsStore, useAcademicStore, useProfileStore, useSubjectStore } from '@/stores';
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
  const subjects = useSubjectStore(s => s.subjects);
  const updateSubject = useSubjectStore(s => s.updateSubject);
  const currentSubjects = subjects.filter(s => !s.semesterId || s.semesterId === `sem-${currentSemNum}` || s.semesterId === currentSemNum.toString());
  
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

  const [settingsModal, setSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'Theory' | 'Lab' | 'Scale'>('Theory');
  const [currentScheme, setCurrentScheme] = useState<GradeScheme>(gradeScheme);
  
  // Settings Temp States — Theory
  const [tempCieCount, setTempCieCount] = useState(settings.cieCount.toString());
  const [tempCieBestOf, setTempCieBestOf] = useState(settings.cieBestOf.toString());
  const [tempCieMaxMarks, setTempCieMaxMarks] = useState(settings.cieMaxMarks.toString());
  const [tempAatEnabled, setTempAatEnabled] = useState(settings.aatEnabled);
  const [tempAatMaxMarks, setTempAatMaxMarks] = useState(settings.aatMaxMarks.toString());
  const [tempMaxInternal, setTempMaxInternal] = useState(settings.maxInternalMarks.toString());
  const [tempMaxExternal, setTempMaxExternal] = useState(settings.maxExternalMarks.toString());
  
  // Settings Temp States — Practical
  const [tempLabCieCount, setTempLabCieCount] = useState(settings.labCieCount.toString());
  const [tempLabCieBestOf, setTempLabCieBestOf] = useState(settings.labCieBestOf.toString());
  const [tempLabCieMaxMarks, setTempLabCieMaxMarks] = useState(settings.labCieMaxMarks.toString());
  const [tempLabAatEnabled, setTempLabAatEnabled] = useState(settings.labAatEnabled);
  const [tempLabAatMaxMarks, setTempLabAatMaxMarks] = useState(settings.labAatMaxMarks.toString());
  const [tempLabComponentMarks, setTempLabComponentMarks] = useState(settings.labComponentMarks.toString());
  const [tempLabMaxInternal, setTempLabMaxInternal] = useState(settings.labMaxInternalMarks.toString());
  const [tempLabMaxExternal, setTempLabMaxExternal] = useState(settings.labMaxExternalMarks.toString());

  const handleSaveSettings = () => {
    if (settingsTab === 'Scale') {
      setGradeScheme(currentScheme);
      setSettingsModal(false);
      return;
    }
    
    const theoryCieMax = (parseInt(tempCieMaxMarks, 10) || 0) * (parseInt(tempCieBestOf, 10) || 0) + (tempAatEnabled ? (parseInt(tempAatMaxMarks, 10) || 0) : 0);
    const theoryTargetInt = parseInt(tempMaxInternal, 10) || 0;
    const theoryTotal = theoryTargetInt + (parseInt(tempMaxExternal, 10) || 0);
    const theoryError = theoryCieMax !== theoryTargetInt || theoryTotal !== 100;

    const labCieMax = (parseInt(tempLabCieMaxMarks, 10) || 0) * (parseInt(tempLabCieBestOf, 10) || 0) + (tempLabAatEnabled ? (parseInt(tempLabAatMaxMarks, 10) || 0) : 0) + (parseInt(tempLabComponentMarks, 10) || 0);
    const labTargetInt = parseInt(tempLabMaxInternal, 10) || 0;
    const labTotal = labTargetInt + (parseInt(tempLabMaxExternal, 10) || 0);
    const labError = labCieMax !== labTargetInt || labTotal !== 100;

    if (theoryError || labError) {
      Alert.alert('Configuration Error', 'Please ensure all internal calculations match target totals and total marks equal 100 before saving.');
      return;
    }

    const theoryUpdates = {
      cieCount: parseInt(tempCieCount, 10) || 1,
      cieBestOf: parseInt(tempCieBestOf, 10) || 1,
      cieMaxMarks: parseInt(tempCieMaxMarks, 10) || 1,
      aatEnabled: tempAatEnabled,
      aatMaxMarks: parseInt(tempAatMaxMarks, 10) || 0,
      maxInternalMarks: parseInt(tempMaxInternal, 10) || 1,
      maxExternalMarks: parseInt(tempMaxExternal, 10) || 1,
    };
    
    const labUpdates = {
      labCieCount: parseInt(tempLabCieCount, 10) || 1,
      labCieBestOf: parseInt(tempLabCieBestOf, 10) || 1,
      labCieMaxMarks: parseInt(tempLabCieMaxMarks, 10) || 1,
      labAatEnabled: tempLabAatEnabled,
      labAatMaxMarks: parseInt(tempLabAatMaxMarks, 10) || 0,
      labComponentMarks: parseInt(tempLabComponentMarks, 10) || 0,
      labMaxInternalMarks: parseInt(tempLabMaxInternal, 10) || 1,
      labMaxExternalMarks: parseInt(tempLabMaxExternal, 10) || 1,
    };

    settings.setTheoryConfig(theoryUpdates);
    settings.setPracticalConfig(labUpdates);
    
    // Auto-update all existing subjects with the new scheme
    const newSettings = { ...settings, ...theoryUpdates, ...labUpdates };
    subjects.forEach(s => {
      let cieMarks: number[] = s.cieMarks || [];
      let aatMarks: number | undefined = s.aatMarks;
      let labMarks: number[] = s.labInternalMarks || [];
      
      if (s.components) {
        cieMarks = [];
        labMarks = [];
        aatMarks = undefined;
        s.components.forEach(c => {
          if (c.id === 'legacy-cie' && c.children) {
            c.children.forEach(child => cieMarks.push(child.earnedMarks as number));
          }
          if (c.id === 'legacy-aat') aatMarks = c.earnedMarks;
          if (c.id === 'legacy-lab') labMarks.push(c.earnedMarks as number);
        });
      }

      const newComps = convertLegacyToComponents(
        cieMarks, 
        aatMarks, 
        labMarks, 
        newSettings, 
        s.type === 'lab'
      );
      
      updateSubject(s.id, { 
        components: newComps, 
        cieMarks, 
        aatMarks, 
        labInternalMarks: labMarks 
      });
    });

    setSettingsModal(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSecondary }} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[textStyles.h3, { color: colors.textPrimary }]}>GPA Goals</Text>
        <Pressable style={styles.iconBtn} hitSlop={12} onPress={() => {
          ActionSheetIOS.showActionSheetWithOptions(
            {
              options: ['Cancel', 'College Grading Scheme', 'Auto-populate Semester'],
              cancelButtonIndex: 0,
            },
            (buttonIndex) => {
                if (buttonIndex === 1) {
                  // Reset temp states to current store values on open
                  setTempCieCount(settings.cieCount.toString());
                  setTempCieBestOf(settings.cieBestOf.toString());
                  setTempCieMaxMarks(settings.cieMaxMarks.toString());
                  setTempAatEnabled(settings.aatEnabled);
                  setTempAatMaxMarks(settings.aatMaxMarks.toString());
                  setTempMaxInternal(settings.maxInternalMarks.toString());
                  setTempMaxExternal(settings.maxExternalMarks.toString());
                  
                  setTempLabCieCount(settings.labCieCount.toString());
                  setTempLabCieBestOf(settings.labCieBestOf.toString());
                  setTempLabCieMaxMarks(settings.labCieMaxMarks.toString());
                  setTempLabAatEnabled(settings.labAatEnabled);
                  setTempLabAatMaxMarks(settings.labAatMaxMarks.toString());
                  setTempLabComponentMarks(settings.labComponentMarks.toString());
                  setTempLabMaxInternal(settings.labMaxInternalMarks.toString());
                  
                  setCurrentScheme(gradeScheme);
                  setSettingsTab('Theory');
                  setSettingsModal(true);
                } else if (buttonIndex === 2) {
                  router.push('/(modals)/semester-wizard');
                }
              }
            );
        }}>
          <Ionicons name="settings-outline" size={22} color={colors.primary} />
        </Pressable>
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

            <Link href="/(modals)/forecaster" asChild>
              <Pressable 
                style={{ marginTop: 24, backgroundColor: colors.surfaceHover, padding: spacing.md, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="analytics" size={24} color={colors.primary} />
                <Text style={[textStyles.smallMedium, { color: colors.textPrimary, marginLeft: spacing.sm }]}>Open Grade Forecaster & PDF Export</Text>
              </Pressable>
            </Link>

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

      {/* Grading Scale Settings Modal */}
      <Modal visible={settingsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: '85%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={[textStyles.h3, { color: colors.textPrimary, marginBottom: 8 }]}>
                  {settingsTab === 'Scale' ? 'Grading Scale Setup' : 'College Grading Scheme'}
                </Text>
                <Text style={[textStyles.small, { color: colors.textSecondary, marginBottom: 16 }]}>
                  {settingsTab === 'Scale' ? "Configure your university's grading rules." : "Configure how your college calculates marks."}
                </Text>
              </View>
              {settingsTab !== 'Scale' && (
                <Pressable onPress={() => {
                  ActionSheetIOS.showActionSheetWithOptions(
                    {
                      options: ['Cancel', 'Edit Grade Scale'],
                      cancelButtonIndex: 0,
                    },
                    (buttonIndex) => {
                      if (buttonIndex === 1) {
                        setCurrentScheme(gradeScheme);
                        setSettingsTab('Scale');
                      }
                    }
                  );
                }} style={{ padding: 8 }}>
                  <Ionicons name="ellipsis-vertical" size={20} color={colors.primary} />
                </Pressable>
              )}
            </View>
            
            {settingsTab !== 'Scale' && (
              <View style={{ flexDirection: 'row', backgroundColor: colors.bg, padding: 4, borderRadius: 12, marginBottom: 16 }}>
              <Pressable 
                style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: settingsTab === 'Theory' ? colors.surface : 'transparent', shadowColor: settingsTab === 'Theory' ? '#000' : 'transparent', elevation: settingsTab === 'Theory' ? 2 : 0 }} 
                onPress={() => setSettingsTab('Theory')}
              >
                <Text style={[textStyles.smallMedium, { color: settingsTab === 'Theory' ? colors.primary : colors.textSecondary }]}>Theory Subjects</Text>
              </Pressable>
              <Pressable 
                style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: settingsTab === 'Lab' ? colors.surface : 'transparent', shadowColor: settingsTab === 'Lab' ? '#000' : 'transparent', elevation: settingsTab === 'Lab' ? 2 : 0 }} 
                onPress={() => setSettingsTab('Lab')}
              >
                <Text style={[textStyles.smallMedium, { color: settingsTab === 'Lab' ? colors.primary : colors.textSecondary }]}>Practical Subjects</Text>
              </Pressable>
            </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              {settingsTab === 'Scale' ? (
                <View>
                  <View style={{ flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight, marginBottom: 8 }}>
                    <Text style={[textStyles.smallMedium, { color: colors.textSecondary, flex: 1 }]}>Grade</Text>
                    <Text style={[textStyles.smallMedium, { color: colors.textSecondary, flex: 1 }]}>Points</Text>
                    <Text style={[textStyles.smallMedium, { color: colors.textSecondary, flex: 1.5 }]}>Min Marks</Text>
                  </View>
                  {currentScheme.boundaries.map((boundary, index) => {
                    // Generate a beautiful color based on the grade letter
                    let gradeColor = colors.primary;
                    const letter = boundary.gradeLetter.toUpperCase();
                    if (letter === 'S' || letter === 'O') gradeColor = '#8B5CF6'; // Purple/Gold
                    else if (letter === 'A') gradeColor = '#10B981'; // Green
                    else if (letter === 'B') gradeColor = '#3B82F6'; // Blue
                    else if (letter === 'C') gradeColor = '#0EA5E9'; // Cyan
                    else if (letter === 'D') gradeColor = '#F59E0B'; // Orange
                    else if (letter === 'E') gradeColor = '#EC4899'; // Pink
                    else if (letter === 'F') gradeColor = '#EF4444'; // Red

                    return (
                    <View key={boundary.id} style={{ flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center', backgroundColor: colors.bg, marginBottom: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.borderLight, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <TextInput 
                          style={[styles.input, { color: gradeColor, backgroundColor: gradeColor + '15', borderColor: gradeColor + '30', textAlign: 'center', fontSize: 18, fontWeight: 'bold' }]}
                          value={boundary.gradeLetter}
                          onChangeText={(text) => {
                            setCurrentScheme(prev => ({
                              ...prev,
                              boundaries: prev.boundaries.map(b => b.id === boundary.id ? { ...b, gradeLetter: text } : b)
                            }));
                          }}
                          maxLength={2}
                        />
                      </View>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <TextInput 
                          style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.borderLight, textAlign: 'center' }]}
                          value={String(boundary.gradePoints)}
                          onChangeText={(text) => {
                            const val = parseFloat(text) || 0;
                            setCurrentScheme(prev => ({
                              ...prev,
                              boundaries: prev.boundaries.map(b => b.id === boundary.id ? { ...b, gradePoints: val } : b)
                            }));
                          }}
                          keyboardType="numeric"
                          maxLength={4}
                        />
                      </View>
                      <View style={{ flex: 1.5 }}>
                        <TextInput 
                          style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.borderLight, textAlign: 'center' }]}
                          value={String(boundary.minMarks)}
                          onChangeText={(text) => {
                            const val = parseFloat(text) || 0;
                            setCurrentScheme(prev => ({
                              ...prev,
                              boundaries: prev.boundaries.map(b => b.id === boundary.id ? { ...b, minMarks: val } : b)
                            }));
                          }}
                          keyboardType="numeric"
                          maxLength={5}
                        />
                      </View>
                    </View>
                  )})}
                  <Pressable onPress={() => setCurrentScheme(DEFAULT_GRADE_SCHEME)} style={{ marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceHover, alignItems: 'center' }}>
                    <Text style={[textStyles.smallMedium, { color: colors.textPrimary }]}>Reset to Default</Text>
                  </Pressable>
                </View>
              ) : settingsTab === 'Theory' ? (
                <View style={{ gap: 16 }}>
                  {(() => {
                    const calcMax = (parseInt(tempCieMaxMarks, 10) || 0) * (parseInt(tempCieBestOf, 10) || 0) + (tempAatEnabled ? (parseInt(tempAatMaxMarks, 10) || 0) : 0);
                    const targetInt = parseInt(tempMaxInternal, 10) || 0;
                    const targetExt = parseInt(tempMaxExternal, 10) || 0;
                    const totalMarks = targetInt + targetExt;
                    const mismatchInt = calcMax !== targetInt;
                    const mismatchTotal = totalMarks !== 100;
                    const hasError = mismatchInt || mismatchTotal;
                    
                    return (
                      <View style={{ 
                        backgroundColor: hasError ? colors.danger + '10' : colors.success + '10', 
                        padding: 16, 
                        borderRadius: 16, 
                        borderWidth: 1,
                        borderColor: hasError ? colors.danger + '30' : colors.success + '30',
                        flexDirection: 'row', 
                        alignItems: 'flex-start',
                        shadowColor: hasError ? colors.danger : colors.success,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.05,
                        shadowRadius: 12,
                        elevation: 2
                      }}>
                        <View style={{ 
                          backgroundColor: hasError ? colors.danger + '20' : colors.success + '20',
                          padding: 8,
                          borderRadius: 12,
                          marginRight: 12
                        }}>
                          <Ionicons name={hasError ? "warning" : "checkmark-circle"} size={22} color={hasError ? colors.danger : colors.success} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[textStyles.bodySemiBold, { color: hasError ? colors.danger : colors.success, marginBottom: 8, fontSize: 15 }]}>
                            {hasError ? 'Configuration Mismatch' : 'Perfect Configuration'}
                          </Text>
                          <View style={{ backgroundColor: colors.surface + '80', padding: 10, borderRadius: 10, gap: 6 }}>
                            <Text style={[textStyles.smallMedium, { color: colors.textSecondary, lineHeight: 20 }]}>
                              <Text style={{ color: hasError ? colors.danger : colors.success }}>•</Text> CIE ({tempCieBestOf} × {tempCieMaxMarks || 0}) + AAT ({tempAatEnabled ? (tempAatMaxMarks || 0) : 0}) = <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>{calcMax}</Text>
                            </Text>
                            {mismatchInt && (
                              <Text style={[textStyles.small, { color: colors.danger, fontWeight: '600', marginLeft: 12 }]}>
                                ↳ Internal ({calcMax}) ≠ Target ({targetInt})
                              </Text>
                            )}
                            <Text style={[textStyles.smallMedium, { color: colors.textSecondary, lineHeight: 20 }]}>
                              <Text style={{ color: hasError ? colors.danger : colors.success }}>•</Text> Internal ({targetInt}) + External ({targetExt}) = <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>{totalMarks}</Text>
                            </Text>
                            {mismatchTotal && (
                              <Text style={[textStyles.small, { color: colors.danger, fontWeight: '600', marginLeft: 12 }]}>
                                ↳ Total should equal 100
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })()}

                  <View style={{ backgroundColor: colors.bg, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight }}>
                    <Text style={[textStyles.bodySemiBold, { color: colors.textPrimary, marginBottom: 16 }]}>CIE (Internal Exams)</Text>
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 6 }]}>Total CIEs</Text>
                        <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight, backgroundColor: colors.surface }]} value={tempCieCount} onChangeText={setTempCieCount} keyboardType="number-pad" maxLength={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 6 }]}>Best of N</Text>
                        <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight, backgroundColor: colors.surface }]} value={tempCieBestOf} onChangeText={setTempCieBestOf} keyboardType="number-pad" maxLength={2} />
                      </View>
                    </View>
                    <View>
                      <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 6 }]}>Max marks per CIE</Text>
                      <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight, backgroundColor: colors.surface }]} value={tempCieMaxMarks} onChangeText={setTempCieMaxMarks} keyboardType="number-pad" maxLength={3} />
                    </View>
                  </View>

                  <View style={{ backgroundColor: colors.bg, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: tempAatEnabled ? 12 : 0 }}>
                      <Text style={[textStyles.bodySemiBold, { color: colors.textPrimary }]}>AAT / Assignment</Text>
                      <Pressable onPress={() => setTempAatEnabled(!tempAatEnabled)} style={{ padding: 4 }}>
                         <Ionicons name={tempAatEnabled ? "checkbox" : "square-outline"} size={24} color={colors.primary} />
                      </Pressable>
                    </View>
                    {tempAatEnabled && (
                      <View>
                        <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 6 }]}>Max AAT Marks</Text>
                        <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight, backgroundColor: colors.surface }]} value={tempAatMaxMarks} onChangeText={setTempAatMaxMarks} keyboardType="number-pad" maxLength={3} />
                      </View>
                    )}
                  </View>

                  <View style={{ backgroundColor: colors.bg, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight }}>
                    <Text style={[textStyles.bodySemiBold, { color: colors.textPrimary, marginBottom: 16 }]}>Totals</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 6 }]}>Max Internal</Text>
                        <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight, backgroundColor: colors.surface }]} value={tempMaxInternal} onChangeText={setTempMaxInternal} keyboardType="number-pad" maxLength={3} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 6 }]}>Max External (SEE)</Text>
                        <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight, backgroundColor: colors.surface }]} value={tempMaxExternal} onChangeText={setTempMaxExternal} keyboardType="number-pad" maxLength={3} />
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={{ gap: 16 }}>
                  {(() => {
                    const calcMax = (parseInt(tempLabCieMaxMarks, 10) || 0) * (parseInt(tempLabCieBestOf, 10) || 0) + (tempLabAatEnabled ? (parseInt(tempLabAatMaxMarks, 10) || 0) : 0) + (parseInt(tempLabComponentMarks, 10) || 0);
                    const targetInt = parseInt(tempLabMaxInternal, 10) || 0;
                    const targetExt = parseInt(tempLabMaxExternal, 10) || 0;
                    const totalMarks = targetInt + targetExt;
                    const mismatchInt = calcMax !== targetInt;
                    const mismatchTotal = totalMarks !== 100;
                    const hasError = mismatchInt || mismatchTotal;
                    
                    return (
                      <View style={{ 
                        backgroundColor: hasError ? colors.danger + '10' : colors.success + '10', 
                        padding: 16, 
                        borderRadius: 16, 
                        borderWidth: 1,
                        borderColor: hasError ? colors.danger + '30' : colors.success + '30',
                        flexDirection: 'row', 
                        alignItems: 'flex-start',
                        shadowColor: hasError ? colors.danger : colors.success,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.05,
                        shadowRadius: 12,
                        elevation: 2
                      }}>
                        <View style={{ 
                          backgroundColor: hasError ? colors.danger + '20' : colors.success + '20',
                          padding: 8,
                          borderRadius: 12,
                          marginRight: 12
                        }}>
                          <Ionicons name={hasError ? "warning" : "checkmark-circle"} size={22} color={hasError ? colors.danger : colors.success} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[textStyles.bodySemiBold, { color: hasError ? colors.danger : colors.success, marginBottom: 8, fontSize: 15 }]}>
                            {hasError ? 'Configuration Mismatch' : 'Perfect Configuration'}
                          </Text>
                          <View style={{ backgroundColor: colors.surface + '80', padding: 10, borderRadius: 10, gap: 6 }}>
                            <Text style={[textStyles.smallMedium, { color: colors.textSecondary, lineHeight: 20 }]}>
                              <Text style={{ color: hasError ? colors.danger : colors.success }}>•</Text> CIE ({tempLabCieBestOf} × {tempLabCieMaxMarks || 0}) + AAT ({tempLabAatEnabled ? (tempLabAatMaxMarks || 0) : 0}) + Lab ({tempLabComponentMarks || 0}) = <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>{calcMax}</Text>
                            </Text>
                            {mismatchInt && (
                              <Text style={[textStyles.small, { color: colors.danger, fontWeight: '600', marginLeft: 12 }]}>
                                ↳ Internal ({calcMax}) ≠ Target ({targetInt})
                              </Text>
                            )}
                            <Text style={[textStyles.smallMedium, { color: colors.textSecondary, lineHeight: 20 }]}>
                              <Text style={{ color: hasError ? colors.danger : colors.success }}>•</Text> Internal ({targetInt}) + External ({targetExt}) = <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>{totalMarks}</Text>
                            </Text>
                            {mismatchTotal && (
                              <Text style={[textStyles.small, { color: colors.danger, fontWeight: '600', marginLeft: 12 }]}>
                                ↳ Total should equal 100
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })()}

                  <View style={{ backgroundColor: colors.bg, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight }}>
                    <Text style={[textStyles.bodySemiBold, { color: colors.textPrimary, marginBottom: 16 }]}>CIE (Internal Exams)</Text>
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 6 }]}>Total CIEs</Text>
                        <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight, backgroundColor: colors.surface }]} value={tempLabCieCount} onChangeText={setTempLabCieCount} keyboardType="number-pad" maxLength={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 6 }]}>Best of N</Text>
                        <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight, backgroundColor: colors.surface }]} value={tempLabCieBestOf} onChangeText={setTempLabCieBestOf} keyboardType="number-pad" maxLength={2} />
                      </View>
                    </View>
                    <View>
                      <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 6 }]}>Max marks per CIE</Text>
                      <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight, backgroundColor: colors.surface }]} value={tempLabCieMaxMarks} onChangeText={setTempLabCieMaxMarks} keyboardType="number-pad" maxLength={3} />
                    </View>
                  </View>

                  <View style={{ backgroundColor: colors.bg, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: tempLabAatEnabled ? 12 : 0 }}>
                      <Text style={[textStyles.bodySemiBold, { color: colors.textPrimary }]}>AAT / Assignment</Text>
                      <Pressable onPress={() => setTempLabAatEnabled(!tempLabAatEnabled)} style={{ padding: 4 }}>
                         <Ionicons name={tempLabAatEnabled ? "checkbox" : "square-outline"} size={24} color={colors.primary} />
                      </Pressable>
                    </View>
                    {tempLabAatEnabled && (
                      <View>
                        <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 6 }]}>Max AAT Marks</Text>
                        <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight, backgroundColor: colors.surface }]} value={tempLabAatMaxMarks} onChangeText={setTempLabAatMaxMarks} keyboardType="number-pad" maxLength={3} />
                      </View>
                    )}
                  </View>

                  <View style={{ backgroundColor: colors.bg, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight }}>
                    <Text style={[textStyles.bodySemiBold, { color: colors.textPrimary, marginBottom: 16 }]}>Lab Component</Text>
                    <View>
                      <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 6 }]}>Lab Exam Marks</Text>
                      <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight, backgroundColor: colors.surface }]} value={tempLabComponentMarks} onChangeText={setTempLabComponentMarks} keyboardType="number-pad" maxLength={3} />
                    </View>
                  </View>
                  
                  <View style={{ backgroundColor: colors.bg, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight }}>
                    <Text style={[textStyles.bodySemiBold, { color: colors.textPrimary, marginBottom: 16 }]}>Totals</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 6 }]}>Max Internal</Text>
                        <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight, backgroundColor: colors.surface }]} value={tempLabMaxInternal} onChangeText={setTempLabMaxInternal} keyboardType="number-pad" maxLength={3} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 6 }]}>Max External (SEE)</Text>
                        <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight, backgroundColor: colors.surface }]} value={tempLabMaxExternal} onChangeText={setTempLabMaxExternal} keyboardType="number-pad" maxLength={3} />
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.bgSecondary }]} onPress={() => {
                if (settingsTab === 'Scale') {
                  setSettingsTab('Theory');
                } else {
                  setSettingsModal(false);
                }
              }}>
                <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>{settingsTab === 'Scale' ? 'Back' : 'Cancel'}</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.primary, marginLeft: 12 }]} onPress={handleSaveSettings}>
                <Text style={[textStyles.bodyMedium, { color: '#FFF' }]}>Save Settings</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
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
