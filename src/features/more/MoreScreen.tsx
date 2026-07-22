// Campora — More Screen (Hub Tab)

import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Linking, Modal, ActionSheetIOS, Alert, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { ListRow, Card } from '@/components/ui';
import { useProfileStore, useAcademicStore, useSubjectStore, useSettingsStore } from '@/stores';
import { useDrawerStore } from '@/stores/useDrawerStore';
import { getGPALabel } from '@/lib';
import { TextInput as CustomTextInput } from '@/components/form';
import { convertLegacyToComponents } from '@/lib/gradingEngine';
import { DEFAULT_GRADE_SCHEME, GradeScheme } from '@/types/grading';
import { parseTimeInput, formatTime, timeToMinutes, handleTimeInputChange, handleTimeBlur } from '@/features/timetable/utils/timeUtils';
import { TimePickerModal } from '@/features/timetable/components/TimePickers';


function SectionTitle({ title }: { title: string }) {
  const { colors, spacing, textStyles } = useTheme();
  return (
    <Text style={[textStyles.h3, { color: colors.textPrimary, paddingHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
      {title}
    </Text>
  );
}

export default function MoreScreen() {
  const { colors, spacing, textStyles, radius, isDark } = useTheme();
  const router = useRouter();
  const { setDrawerOpen } = useDrawerStore();
  const profile = useProfileStore((s) => s.profile);
  const semesters = useAcademicStore((s) => s.semesters);
  const gradeEntries = useAcademicStore((s) => s.gradeEntries);
  const cgpa = useAcademicStore((s) => s.getCGPA());

  const name = profile?.name || 'Guest User';
  const subtitle = profile?.enrollmentNumber && profile?.branch && profile?.currentSemester 
    ? `${profile.enrollmentNumber} • ${profile.branch}, ${profile.currentSemester}th Semester`
    : 'Complete your profile';
  
  const currentSemester = useAcademicStore(s => s.getCurrentSemester());
  const currentSGPA = useAcademicStore(s => currentSemester ? s.getSGPA(currentSemester.id) : 0);
  const sgpaValue = currentSGPA > 0 ? currentSGPA.toFixed(2) : '--';

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

  // Passing Criteria State
  const [showPassingCriteriaModal, setShowPassingCriteriaModal] = useState(false);

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

  
  const handleNav = (route: string) => {
    setDrawerOpen(false);
    setTimeout(() => {
      router.push(route as any);
    }, 50);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          <Text style={[textStyles.h1, { color: colors.textPrimary, marginBottom: 4 }]}>More</Text>
          <Text style={[textStyles.body, { color: colors.textSecondary }]}>All tools and settings in one place.</Text>
        </View>

        {/* Profile Card */}
      <Animated.View entering={FadeInDown.delay(20).duration(100)} style={{ paddingHorizontal: spacing.xl, marginTop: spacing.md }}>
        <Pressable onPress={() => handleNav('/profile')} style={{ borderRadius: 24, overflow: 'hidden', elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16 }}>
          <LinearGradient
            colors={isDark ? ['#0F172A', '#1E1B4B', '#4C1D95'] : ['#2E1065', '#4C1D95', '#7C3AED']}
            style={{ padding: 20 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Optional background abstract shapes for beauty */}
            <View style={{ position: 'absolute', top: -30, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <View style={{ position: 'absolute', bottom: -40, left: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)' }} />

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Avatar */}
              <View style={{ width: 68, height: 68, borderRadius: 34, marginRight: spacing.md, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }}>
                {profile?.avatarUri ? (
                  <Image source={{ uri: profile.avatarUri }} style={{ width: 68, height: 68 }} />
                ) : (
                  <Ionicons name="person" size={32} color="#FFFFFF" />
                )}
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.h3, { color: '#FFFFFF', fontSize: 20, marginBottom: 4 }]} numberOfLines={1}>{name}</Text>
                <Text style={[textStyles.small, { color: 'rgba(255,255,255,0.75)', marginBottom: 12 }]} numberOfLines={2}>{subtitle}</Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                    <Ionicons name="person-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={[textStyles.smallMedium, { color: '#FFFFFF', fontSize: 11 }]}>View Profile</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(20).duration(100)}>
        <SectionTitle title="Academic Hub" />
        <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
          <Card variant="flat" padding={0}>
            <ListRow icon="flag" iconColor="#8B5CF6" iconBackgroundColor="#8B5CF620" title="Attendance Goals" subtitle="Set your target attendance" onPress={() => handleNav('/academics/attendance-goals')} />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow icon="book" iconColor="#3B82F6" iconBackgroundColor="#3B82F620" title="Subjects" subtitle="Manage your courses" onPress={() => handleNav('/academics/subjects')} />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow icon="bar-chart" iconColor="#EC4899" iconBackgroundColor="#EC489920" title="Performance Analytics" subtitle="View grades and statistics" onPress={() => handleNav('/analytics')} />
          </Card>
        </View>

        <SectionTitle title="College Configuration" />
        <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
          <Card variant="flat" padding={0}>
            <ListRow icon="calculator" iconColor={colors.primary} iconBackgroundColor={colors.primary + '20'} title="College Grading Scheme" subtitle="Setup internal and external marks" onPress={openGradingScheme} />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow icon="library" iconColor="#10B981" iconBackgroundColor="#10B98120" title="Import Semester Subjects" subtitle="Load subjects from templates" onPress={() => handleNav('/(modals)/import-subjects')} />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow icon="time" iconColor="#F59E0B" iconBackgroundColor="#F59E0B20" title="College Timings" subtitle="Set daily start and end times" onPress={() => {
              setTStartTimeInput(settings.collegeStartTime);
              setTEndTimeInput(settings.collegeEndTime);
              const sD = new Date();
              const [sH, sM] = settings.collegeStartTime.split(':');
              sD.setHours(parseInt(sH, 10), parseInt(sM, 10), 0, 0);
              setTStartTime(sD);
              const eD = new Date();
              const [eH, eM] = settings.collegeEndTime.split(':');
              eD.setHours(parseInt(eH, 10), parseInt(eM, 10), 0, 0);
              setTEndTime(eD);
              setShowTimingsModal(true);
            }} />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow icon="checkmark-circle" iconColor="#EF4444" iconBackgroundColor="#EF444420" title="Passing Criteria" subtitle="Set minimum marks to pass" rightText={`${passingMarks} Marks`} onPress={() => setShowPassingCriteriaModal(true)} />
          </Card>
        </View>

        <SectionTitle title="App Settings & Support" />
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Card variant="flat" padding={0}>
            <ListRow icon="settings-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight} title="App Settings" subtitle="Customize your app experience" onPress={() => handleNav('/settings')} />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow icon="shield-checkmark-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight} title="Privacy Policy" subtitle="Read our privacy policy" onPress={() => handleNav('/(modals)/privacy-policy')} />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow icon="information-circle-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight} title="About CampusIQ" subtitle="Learn more about the app" rightText="v1.0.0" onPress={() => handleNav('/(modals)/about')} showChevron={false} />
          </Card>
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

      {/* Passing Criteria Modal */}
      {showPassingCriteriaModal && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.bg, width: '90%', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 }}>
            <Text style={[textStyles.h2, { color: colors.textPrimary, marginBottom: 8 }]}>Passing Criteria</Text>
            <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: 20 }]}>Minimum marks required to pass.</Text>
            
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
                <Pressable
                  onPress={() => setPassingMarks(Math.max(0, passingMarks - 1))}
                  style={({pressed}) => [{
                    width: 48, height: 48, borderRadius: 24,
                    backgroundColor: pressed ? colors.surfaceHover : colors.surface,
                    borderWidth: 1, borderColor: colors.borderLight,
                    justifyContent: 'center', alignItems: 'center',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
                  }]}
                >
                  <Ionicons name="remove" size={24} color={colors.textSecondary} />
                </Pressable>
                
                <View style={{ width: 90, alignItems: 'center' }}>
                  <TextInput
                    style={[textStyles.h1, { color: colors.primary, fontSize: 48, textAlign: 'center' }]}
                    keyboardType="numeric"
                    value={passingMarks > 0 ? passingMarks.toString() : ''}
                    onChangeText={handleMarksChange}
                    maxLength={3}
                  />
                </View>
            
                <Pressable
                  onPress={() => setPassingMarks(passingMarks + 1)}
                  style={({pressed}) => [{
                    width: 48, height: 48, borderRadius: 24,
                    backgroundColor: pressed ? colors.primary + '20' : colors.primary + '10',
                    borderWidth: 1, borderColor: colors.primary + '30',
                    justifyContent: 'center', alignItems: 'center',
                    shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
                  }]}
                >
                  <Ionicons name="add" size={24} color={colors.primary} />
                </Pressable>
              </View>
            </View>

            <View style={{ marginTop: 24, backgroundColor: colors.danger + '10', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', width: '100%', borderWidth: 1, borderColor: colors.danger + '20' }}>
              <Ionicons name="alert-circle" size={20} color={colors.danger} style={{ marginRight: 8 }} />
              <Text style={[textStyles.smallMedium, { color: colors.danger, flex: 1, lineHeight: 18 }]}>
                Subjects scoring below {passingMarks} marks will be marked as a Backlog.
              </Text>
            </View>

            <Pressable style={{ marginTop: 24, padding: 16, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' }} onPress={() => setShowPassingCriteriaModal(false)}>
              <Text style={[textStyles.bodyMedium, { color: '#FFF' }]}>Done</Text>
            </Pressable>
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 24, padding: 24 },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, minHeight: 48, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 32 },
  modalBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }
});
