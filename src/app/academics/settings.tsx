import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Modal, ActionSheetIOS, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useSettingsStore, useAcademicStore, useSubjectStore } from '@/stores';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '@/components/ui';
import { TextInput as CustomTextInput } from '@/components/form';
import { convertLegacyToComponents } from '@/lib/gradingEngine';
import { DEFAULT_GRADE_SCHEME, GradeScheme } from '@/types/grading';
import { parseTimeInput, formatTime, timeToMinutes, handleTimeInputChange, handleTimeBlur } from '@/features/timetable/utils/timeUtils';
import { TimePickerModal } from '@/features/timetable/components/TimePickers';
import { KeyboardAvoidingView } from 'react-native';

export default function AcademicSettingsScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();
  
  const settings = useSettingsStore();
  const { passingMarks, setPassingMarks } = settings;
  const gradeScheme = useAcademicStore(s => s.gradeScheme);
  const setGradeScheme = useAcademicStore(s => s.setGradeScheme);
  const subjects = useSubjectStore(s => s.subjects);
  const updateSubject = useSubjectStore(s => s.updateSubject);

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

  // College Timings State
  const [showTimingsModal, setShowTimingsModal] = useState(false);
  const [tStartTimeInput, setTStartTimeInput] = useState(settings.collegeStartTime);
  const [tEndTimeInput, setTEndTimeInput] = useState(settings.collegeEndTime);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [tStartTime, setTStartTime] = useState<Date | null>(null);
  const [tEndTime, setTEndTime] = useState<Date | null>(null);

  React.useEffect(() => { if (tStartTime) setTStartTimeInput(formatTime(tStartTime)); }, [tStartTime]);
  React.useEffect(() => { if (tEndTime) setTEndTimeInput(formatTime(tEndTime)); }, [tEndTime]);

  const handleSaveTimings = () => {
    const sParsed = parseTimeInput(tStartTimeInput);
    const eParsed = parseTimeInput(tEndTimeInput);
    if (!sParsed || !eParsed) {
      Alert.alert('Invalid Time', 'Please enter valid times in HH:MM format.');
      return;
    }
    const sStr = formatTime(sParsed);
    const eStr = formatTime(eParsed);
    const sMins = timeToMinutes(sStr);
    const eMins = timeToMinutes(eStr);
    if (sMins === eMins) {
      Alert.alert('Invalid Range', 'Start time and end time cannot be the same.');
      return;
    }
    const s24 = `${sParsed.getHours().toString().padStart(2, '0')}:${sParsed.getMinutes().toString().padStart(2, '0')}`;
    const e24 = `${eParsed.getHours().toString().padStart(2, '0')}:${eParsed.getMinutes().toString().padStart(2, '0')}`;
    settings.setCollegeTimings(s24, e24);
    setShowTimingsModal(false);
  };

  const handleMarksChange = (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setPassingMarks(num);
    } else if (val === '') {
      setPassingMarks(0);
    }
  };

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

  const openGradingScheme = () => {
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
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.bg }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.borderLight }]} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Academic Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInDown.delay(100).duration(200)}>
          <Card variant="elevated" padding={spacing.lg} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="settings" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Configuration</Text>
                <Text style={[textStyles.small, { color: colors.textSecondary }]}>Manage academic rules</Text>
              </View>
            </View>
            
            <View style={{ marginTop: 20 }}>
              <Pressable 
                onPress={openGradingScheme}
                style={({ pressed }) => [
                  styles.optionBtn,
                  { backgroundColor: pressed ? colors.surfaceHover : colors.surface }
                ]}
              >
                <Ionicons name="calculator-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>College Grading Scheme</Text>
                  <Text style={[textStyles.small, { color: colors.textSecondary }]}>Configure internal and external marks</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </Pressable>

              <Pressable 
                onPress={() => router.push('/(modals)/semester-wizard')}
                style={({ pressed }) => [
                  styles.optionBtn,
                  { backgroundColor: pressed ? colors.surfaceHover : colors.surface, marginTop: 12 }
                ]}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>Auto-populate Semester</Text>
                  <Text style={[textStyles.small, { color: colors.textSecondary }]}>Setup semester dates easily</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </Pressable>

              <Pressable 
                onPress={() => {
                  setTStartTimeInput(settings.collegeStartTime);
                  setTEndTimeInput(settings.collegeEndTime);
                  
                  const sD = new Date();
                  const [sH, sM] = settings.collegeStartTime.split(':');
                  sD.setHours(parseInt(sH), parseInt(sM), 0, 0);
                  setTStartTime(sD);
                  
                  const eD = new Date();
                  const [eH, eM] = settings.collegeEndTime.split(':');
                  eD.setHours(parseInt(eH), parseInt(eM), 0, 0);
                  setTEndTime(eD);
                  
                  setShowTimingsModal(true);
                }}
                style={({ pressed }) => [
                  styles.optionBtn,
                  { backgroundColor: pressed ? colors.surfaceHover : colors.surface, marginTop: 12 }
                ]}
              >
                <Ionicons name="time-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>College Timings</Text>
                  <Text style={[textStyles.small, { color: colors.textSecondary }]}>Set your college start and end times</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </Pressable>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(200)}>
          <Card variant="elevated" padding={spacing.lg} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Passing Criteria</Text>
                <Text style={[textStyles.small, { color: colors.textSecondary }]}>Minimum marks to pass a subject</Text>
              </View>
            </View>
            
            <View style={{ marginTop: 20 }}>
              <CustomTextInput 
                label="Passing Marks"
                placeholder="40"
                keyboardType="numeric"
                value={passingMarks > 0 ? passingMarks.toString() : ''}
                onChangeText={handleMarksChange}
              />
              <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: -8 }]}>
                Subjects scoring below this will be marked as a Backlog.
              </Text>
            </View>
          </Card>
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
                    let gradeColor = colors.primary;
                    const letter = boundary.gradeLetter.toUpperCase();
                    if (letter === 'S' || letter === 'O') gradeColor = '#8B5CF6';
                    else if (letter === 'A') gradeColor = '#10B981';
                    else if (letter === 'B') gradeColor = '#3B82F6';
                    else if (letter === 'C') gradeColor = '#0EA5E9';
                    else if (letter === 'D') gradeColor = '#F59E0B';
                    else if (letter === 'E') gradeColor = '#EC4899';
                    else if (letter === 'F') gradeColor = '#EF4444';

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

      {/* College Timings Overlay */}
      {showTimingsModal && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.bg, width: '90%', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 }}>
            <Text style={[textStyles.h2, { color: colors.textPrimary, marginBottom: 8 }]}>College Timings</Text>
            <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: 20 }]}>Set your college start and end times.</Text>
            <CustomTextInput 
              label="Start Time" 
              placeholder="08:00" 
              value={tStartTimeInput} 
              onChangeText={(t) => setTStartTimeInput(handleTimeInputChange(t, tStartTimeInput))}
              onBlur={() => handleTimeBlur(tStartTimeInput, setTStartTime, setTStartTimeInput)}
              keyboardType="numbers-and-punctuation"
              iconRight="time-outline"
              onIconRightPress={() => { Platform.OS !== 'web' ? setShowStartTimePicker(true) : Alert.alert('Native Picker', 'Time pickers are native elements.'); }}
            />
            <View style={{ height: 16 }} />
            <CustomTextInput 
              label="End Time" 
              placeholder="18:00" 
              value={tEndTimeInput} 
              onChangeText={(t) => setTEndTimeInput(handleTimeInputChange(t, tEndTimeInput))}
              onBlur={() => handleTimeBlur(tEndTimeInput, setTEndTime, setTEndTimeInput)}
              keyboardType="numbers-and-punctuation"
              iconRight="time-outline"
              onIconRightPress={() => { Platform.OS !== 'web' ? setShowEndTimePicker(true) : Alert.alert('Native Picker', 'Time pickers are native elements.'); }}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <Pressable style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center' }} onPress={() => setShowTimingsModal(false)}>
                <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>Cancel</Text>
              </Pressable>
              <Pressable style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' }} onPress={handleSaveTimings}>
                <Text style={[textStyles.bodyMedium, { color: '#FFF' }]}>Save</Text>
              </Pressable>
            </View>
          </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Time Pickers for College Timings */}
      <TimePickerModal
        visible={showStartTimePicker}
        value={tStartTime || new Date()}
        title="Start Time"
        onClose={() => setShowStartTimePicker(false)}
        onChange={(selectedTime) => {
          setTStartTime(selectedTime);
        }}
      />
      <TimePickerModal
        visible={showEndTimePicker}
        value={tEndTime || new Date()}
        title="End Time"
        onClose={() => setShowEndTimePicker(false)}
        onChange={(selectedTime) => {
          setTEndTime(selectedTime);
        }}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 24,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 24, padding: 24 },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, minHeight: 48, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 32 },
  modalBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }
});
