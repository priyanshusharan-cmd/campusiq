// Campora — Unified Signup Screen (Onboarding)

import React, { useState, useCallback } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, StyleSheet, Pressable, Modal } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeOutDown, FadeInRight, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/theme';
import { useProfileStore, useSettingsStore } from '@/stores';

// Step components
import { PersonalInfoStep } from '@/features/onboarding/components/PersonalInfoStep';
import { AcademicInfoStep, SemesterDatesStep } from '@/features/onboarding/components/AcademicInfoStep';

export default function WelcomeScreen() {
  const { colors, spacing, textStyles, radius, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const setProfile = useProfileStore((s) => s.setProfile);
  const setOnboardingCompleted = useSettingsStore((s) => s.setOnboardingCompleted);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [college, setCollege] = useState('');
  const [major, setMajor] = useState('');
  const [semester, setSemester] = useState('');
  const [semesterStart, setSemesterStart] = useState('');
  const [semesterEnd, setSemesterEnd] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'dob' | 'semesterStart' | 'semesterEnd' | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  // Floating animation for the logo
  const translateY = useSharedValue(0);

  // Date helpers
  const getLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    if (dateStr.includes('/')) {
      const [d, m, y] = dateStr.split('/').map(Number);
      if (y > 1000 && m >= 1 && m <= 12 && d >= 1 && d <= 31) return new Date(y, m - 1, d);
    }
    if (dateStr.includes('-')) {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  };

  const formatLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${d}/${m}/${y}`;
  };

  const toISODate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = getLocalDate(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleDateChange = (text: string, currentVal: string, setter: (val: string) => void) => {
    let cleaned = text.replace(/[^0-9/]/g, '');
    if (text.length < currentVal.length) { setter(cleaned); return; }
    if (cleaned.length === 2 && !cleaned.includes('/')) cleaned += '/';
    else if (cleaned.length === 5 && (cleaned.match(/\//g) || []).length === 1) cleaned += '/';
    setter(cleaned);
  };

  const openPicker = (field: 'dob' | 'semesterStart' | 'semesterEnd') => {
    setShowDatePicker(field);
    let initialDate = new Date();
    if (field === 'dob' && dob) initialDate = getLocalDate(dob);
    if (field === 'semesterStart' && semesterStart) initialDate = getLocalDate(semesterStart);
    if (field === 'semesterEnd' && semesterEnd) initialDate = getLocalDate(semesterEnd);
    setTempDate(initialDate);
  };

  useFocusEffect(
    useCallback(() => {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // infinite
        true // reverse
      );

      setName(''); setEmail(''); setDob(''); setRollNo(''); setCollege(''); setMajor('');
      setSemester(''); setSemesterStart(''); setSemesterEnd('');
      setFocusedField(null); setErrorMsg(null); setStep(1);
    }, [])
  );

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  const isStepValid = () => {
    if (step === 1) return name.trim() && email.trim() && rollNo.trim() && dob.trim();
    if (step === 2) return college.trim() && major.trim() && semester.trim();
    return semesterStart.trim() && semesterEnd.trim();
  };
  const valid = isStepValid();

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim() || !email.trim() || !rollNo.trim() || !dob.trim()) { setErrorMsg('Please fill all required details'); setTimeout(() => setErrorMsg(null), 3000); return; }
      if (name.trim().length < 3) { setErrorMsg('Name must be at least 3 characters'); setTimeout(() => setErrorMsg(null), 3000); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErrorMsg('Please enter a valid email address'); setTimeout(() => setErrorMsg(null), 3000); return; }
      setStep(2);
    } else if (step === 2) {
      if (!college.trim() || !major.trim() || !semester.trim()) { setErrorMsg('Please fill all required academic details'); setTimeout(() => setErrorMsg(null), 3000); return; }
      setStep(3);
    } else {
      if (!semesterStart.trim() || !semesterEnd.trim()) { setErrorMsg('Please select semester dates'); setTimeout(() => setErrorMsg(null), 3000); return; }
      setProfile({ name: name.trim(), email: email.trim(), dob: toISODate(dob), enrollmentNumber: rollNo.trim(), college: college.trim(), branch: major.trim(), currentSemester: parseInt(semester, 10) || 1, semesterStartDate: toISODate(semesterStart), semesterEndDate: toISODate(semesterEnd) });
      setOnboardingCompleted(true);
      router.replace('/(tabs)');
    }
  };

  const inputWrapperStyle = [styles.inputWrapper, { backgroundColor: colors.bg, borderColor: colors.border }];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Top Header */}
        <LinearGradient colors={['#0F091A', '#231545']} style={[styles.headerArea, { paddingTop: insets.top }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {step > 1 && (
            <Pressable onPress={() => setStep(step - 1)} style={{ position: 'absolute', top: insets.top + 16, left: 24, zIndex: 10, padding: 8 }}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </Pressable>
          )}
          <Animated.View entering={FadeInDown.delay(100).duration(800).springify()} style={[styles.brandingWrap, floatingStyle]}>
            {/* Glowing Orb */}
            <View style={styles.glowingOrb} />
            <View style={styles.appIconContainer}>
              <Image 
                source={require('@/assets/images/campusiq-icon-transparent.png')} 
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
              />
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Form */}
        <View style={[styles.formContainer, { backgroundColor: colors.surface, borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'] }]}>
          <Animated.View key={`header-${step}`} entering={FadeInRight.duration(300).springify()}>
            <Text style={[textStyles.h1, { color: colors.textPrimary }]}>
              {step === 1 ? 'Personal Details' : step === 2 ? 'Academic Details' : 'Semester Details'}
            </Text>
            <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl }]}>
              {step === 1 ? 'Let us know who you are' : step === 2 ? 'Tell us about your college' : 'Set up your current semester'}
            </Text>
          </Animated.View>

          <Animated.View key={`step-${step}`} entering={FadeInRight.duration(400).springify()} style={{ gap: spacing.md }}>
            {step === 1 && (
              <PersonalInfoStep
                name={name} setName={setName} email={email} setEmail={setEmail}
                rollNo={rollNo} setRollNo={setRollNo} dob={dob}
                onDobChange={(t) => handleDateChange(t, dob, setDob)}
                focusedField={focusedField} setFocusedField={setFocusedField}
                onOpenDatePicker={() => openPicker('dob')}
                inputWrapperStyle={inputWrapperStyle}
              />
            )}
            {step === 2 && (
              <AcademicInfoStep
                college={college} setCollege={setCollege} major={major} setMajor={setMajor}
                semester={semester} setSemester={setSemester}
                focusedField={focusedField} setFocusedField={setFocusedField}
                inputWrapperStyle={inputWrapperStyle}
              />
            )}
            {step === 3 && (
              <SemesterDatesStep
                semesterStart={semesterStart} onSemesterStartChange={(t) => handleDateChange(t, semesterStart, setSemesterStart)}
                semesterEnd={semesterEnd} onSemesterEndChange={(t) => handleDateChange(t, semesterEnd, setSemesterEnd)}
                focusedField={focusedField} setFocusedField={setFocusedField}
                onOpenStartPicker={() => openPicker('semesterStart')}
                onOpenEndPicker={() => openPicker('semesterEnd')}
                inputWrapperStyle={inputWrapperStyle}
              />
            )}

            <Pressable onPress={handleNext} style={({ pressed }) => [styles.submitButton, { backgroundColor: valid ? colors.primary : colors.primaryLight, opacity: pressed ? 0.9 : 1, marginTop: spacing.md }]}>
              <Text style={[textStyles.h3, { color: valid ? colors.white : colors.primary, marginRight: 8 }]}>
                {step === 3 ? 'Create Account' : 'Continue'}
              </Text>
              <Ionicons name={step === 3 ? "checkmark-circle-outline" : "arrow-forward-circle-outline"} size={24} color={valid ? colors.white : colors.primary} />
            </Pressable>
          </Animated.View>

          {/* Footer */}
          <View style={{ alignItems: 'center', marginTop: spacing['3xl'], paddingBottom: spacing.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
              <Ionicons name="shield-checkmark" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[textStyles.smallMedium, { color: colors.primary }]}>Your data stays securely on your device</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 }}>
            <Animated.View entering={FadeInDown.duration(300)} style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={[textStyles.h2, { color: colors.textPrimary }]}>Select Date</Text>
                <Pressable onPress={() => setShowDatePicker(null)}>
                  <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                themeVariant={isDark ? 'dark' : 'light'}
                onValueChange={(event: any, date: Date) => {
                  setTempDate(date);
                  if (Platform.OS === 'android') {
                    const fmt = formatLocalDate(date);
                    if (showDatePicker === 'dob') setDob(fmt);
                    else if (showDatePicker === 'semesterStart') setSemesterStart(fmt);
                    else if (showDatePicker === 'semesterEnd') setSemesterEnd(fmt);
                    setShowDatePicker(null);
                  }
                }}
                onDismiss={() => setShowDatePicker(null)}
              />
              {Platform.OS === 'ios' && (
                <Pressable
                  onPress={() => {
                    const fmt = formatLocalDate(tempDate);
                    if (showDatePicker === 'dob') setDob(fmt);
                    if (showDatePicker === 'semesterStart') setSemesterStart(fmt);
                    if (showDatePicker === 'semesterEnd') setSemesterEnd(fmt);
                    setShowDatePicker(null);
                  }}
                  style={{ backgroundColor: colors.primary, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 16 }}
                >
                  <Text style={[textStyles.h3, { color: colors.white }]}>Done</Text>
                </Pressable>
              )}
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Snackbar */}
      {errorMsg && (
        <Animated.View entering={FadeInDown.duration(200)} exiting={FadeOutDown.duration(200)} style={[styles.snackbar, { bottom: insets.bottom + 40 }]}>
          <Ionicons name="alert-circle" size={20} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={[textStyles.smallMedium, { color: colors.white }]}>{errorMsg}</Text>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerArea: { height: 310, width: '100%', alignItems: 'center', justifyContent: 'center' },
  brandingWrap: { alignItems: 'center', marginTop: -30, justifyContent: 'center' },
  glowingOrb: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: '#00E5FF', opacity: 0.15, shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 60, elevation: 20 },
  appIconContainer: { width: 150, height: 150, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  formContainer: { flex: 1, marginTop: -32, paddingHorizontal: 24, paddingTop: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 20 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, height: 56, paddingHorizontal: 16 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, shadowColor: '#7C5CFC', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  snackbar: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5, zIndex: 1000 },
});
