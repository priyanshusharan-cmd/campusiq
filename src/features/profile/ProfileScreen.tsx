// Campora — Profile Screen

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/theme';
import { Card, ListRow } from '@/components/ui';
import { useProfileStore, useAcademicStore, useSubjectStore, useActiveSubjects } from '@/stores';
import { calculateSubjectBounds } from '@/lib/gradingEngine';
import { gradeToPoint } from '@/lib';
import { ProfileViewCard } from './components/ProfileViewCard';

function ProfileField({ 
  icon, 
  label, 
  value, 
  renderEdit,
  isEditing,
  onPress
}: { 
  icon: keyof typeof Ionicons.glyphMap, 
  label: string, 
  value?: string,
  renderEdit?: React.ReactNode,
  isEditing?: boolean,
  onPress?: () => void
}) {
  const { colors, textStyles, isDark } = useTheme();
  
  return (
    <Pressable 
      onPress={onPress}
      style={{ 
        borderWidth: 1.5, 
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
        borderRadius: 16, 
        paddingHorizontal: 16, 
        paddingVertical: 14, 
        position: 'relative'
      }}
    >
      <View style={{ 
        position: 'absolute', 
        top: -10, 
        left: 14, 
        backgroundColor: colors.surface, 
        paddingHorizontal: 6 
      }}>
        <Text style={[textStyles.smallMedium, { color: colors.textSecondary, fontSize: 11, letterSpacing: 0.5 }]}>
          {label}
        </Text>
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name={icon} size={22} color={colors.textSecondary} style={{ marginRight: 16 }} />
        {isEditing && renderEdit ? (
          <View style={{ flex: 1, minHeight: 24, justifyContent: 'center' }}>{renderEdit}</View>
        ) : (
          <Text style={[textStyles.h3, { color: colors.textPrimary, flex: 1, fontSize: 16 }]} numberOfLines={1}>
            {value}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function SectionTitle({ title }: { title: string }) {
  const { colors, spacing, textStyles } = useTheme();
  return (
    <Text style={[textStyles.h3, { color: colors.textPrimary, paddingHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
      {title}
    </Text>
  );
}

export default function ProfileScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();
  const { profile, updateProfile } = useProfileStore();
  
  const currentSemester = useAcademicStore(s => s.getCurrentSemester());
  const currentSGPA = useAcademicStore(s => currentSemester ? s.getSGPA(currentSemester.id) : 0);
  const semesters = useAcademicStore(s => s.semesters);
  const cgpa = useAcademicStore(s => s.getCGPA());
  const gradeEntries = useAcademicStore(s => s.gradeEntries);
  const completedCredits = gradeEntries.reduce((sum, e) => sum + e.credits, 0);

  // Current SGPA Calculation
  const currentSemesterSubjects = useActiveSubjects();
  let displayedSGPA = currentSGPA;
  let isPredictedSGPA = false;

  if (currentSGPA === 0 && currentSemesterSubjects.length > 0) {
    let totalPoints = 0;
    let totalCredits = 0;
    currentSemesterSubjects.forEach(sub => {
      const bounds = calculateSubjectBounds(sub.components || [], {});
      // Compute percentage (ceiling out of total max)
      const maxPossible = sub.components?.reduce((sum, c) => sum + (c.type === 'grouped' ? c.weight : c.maxMarks), 0) || 100;
      const percentage = Math.round((bounds.ceiling / maxPossible) * 100);
      let gradePoints = 0;
      if (percentage >= 90) gradePoints = 10;
      else if (percentage >= 80) gradePoints = 9;
      else if (percentage >= 70) gradePoints = 8;
      else if (percentage >= 60) gradePoints = 7;
      else if (percentage >= 50) gradePoints = 6;
      else if (percentage >= 40) gradePoints = 5;
      else if (percentage >= 35) gradePoints = 4;
      
      totalPoints += gradePoints * sub.credits;
      totalCredits += sub.credits;
    });
    if (totalCredits > 0) {
      displayedSGPA = totalPoints / totalCredits;
      isPredictedSGPA = true;
    }
  }

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name || '', email: profile?.email || '', phone: profile?.phone || '',
    dob: profile?.dob || '', address: profile?.address || '', enrollmentNumber: profile?.enrollmentNumber || '',
    branch: profile?.branch || '', currentSemester: profile?.currentSemester?.toString() || '',
    academicYear: profile?.academicYear || '', semesterStartDate: profile?.semesterStartDate || '',
    semesterEndDate: profile?.semesterEndDate || '', college: profile?.college || '', section: profile?.section || '',
  });
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);

  const toggleEdit = () => {
    if (isEditing) {
      const newSemesterNum = parseInt(form.currentSemester) || 1;
      const currentSemesterNum = profile?.currentSemester || 1;
      
      const saveChanges = () => {
        updateProfile({ ...form, currentSemester: newSemesterNum });
        
        // Sync with Academic Store
        const academicStore = useAcademicStore.getState();
        const existingSemester = academicStore.semesters.find((s) => s.number === newSemesterNum);
        if (existingSemester) {
          academicStore.setCurrentSemester(existingSemester.id);
        } else {
          academicStore.addSemester({
            name: `Semester ${newSemesterNum}`,
            number: newSemesterNum,
            isCurrent: true,
          });
        }
        
        // --- SYNC SUBJECTS: If grade tracker has data for this semester, create subjects ---
        const targetAcademicSem = academicStore.semesters.find(s => s.number === newSemesterNum);
        if (targetAcademicSem?.sgpaSubjects && targetAcademicSem.sgpaSubjects.length > 0) {
          const subjectStore = useSubjectStore.getState();
          const semStr = newSemesterNum.toString();
          const existingSubjectsForSem = subjectStore.subjects.filter(s => s.semesterId === semStr);
          
          targetAcademicSem.sgpaSubjects.forEach(sgpaSub => {
            if (!sgpaSub.name || !sgpaSub.name.trim()) return;
            
            const existsById = existingSubjectsForSem.find(s => s.id === sgpaSub.id);
            const existsByName = existingSubjectsForSem.find(s => 
              s.name.trim().toLowerCase() === sgpaSub.name.trim().toLowerCase()
            );
            
            if (!existsById && !existsByName) {
              subjectStore.addSubject({
                name: sgpaSub.name,
                code: sgpaSub.code || '',
                credits: parseFloat(sgpaSub.credits) || 3,
                semesterId: semStr,
              });
            }
          });
        }
        
        setIsEditing(false);
      };

      if (newSemesterNum !== currentSemesterNum) {
        Alert.alert(
          "Change Semester?",
          `Are you sure you want to switch to Semester ${newSemesterNum}? This will load all subjects, timetable, and attendance records for Semester ${newSemesterNum}.`,
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Switch Semester", 
              onPress: saveChanges 
            }
          ]
        );
        return; // Don't toggle edit mode yet, wait for confirmation
      } else {
        saveChanges();
        return;
      }
    } else {
      setForm({
        name: profile?.name || '', email: profile?.email || '', phone: profile?.phone || '',
        dob: profile?.dob || '', address: profile?.address || '', enrollmentNumber: profile?.enrollmentNumber || '',
        branch: profile?.branch || '', currentSemester: profile?.currentSemester?.toString() || '',
        academicYear: profile?.academicYear || '', semesterStartDate: profile?.semesterStartDate || '',
        semesterEndDate: profile?.semesterEndDate || '', college: profile?.college || '', section: profile?.section || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handlePickAvatar = async () => {
    const options: any[] = [
      { text: "Cancel", style: "cancel" }
    ];

    if (profile?.avatarUri) {
      options.push({
        text: "Remove Photo",
        style: "destructive",
        onPress: () => updateProfile({ ...profile, avatarUri: undefined })
      });
    }

    options.push({
      text: "Choose from Library",
      onPress: async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
          return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled) {
          updateProfile({ ...profile, avatarUri: result.assets[0].uri });
        }
      }
    });

    Alert.alert("Profile Picture", "Choose an option", options);
  };

  const renderRight = (key: keyof typeof form, placeholder: string, keyboardType: any = 'default') => {
    if (isEditing) {
      if (key === 'semesterStartDate' || key === 'semesterEndDate' || key === 'dob') {
        return (
          <Text style={[textStyles.h3, { color: form[key] ? colors.textPrimary : colors.textTertiary, textAlign: 'left', fontSize: 16 }]}>{form[key] || placeholder}</Text>
        );
      }
      return (
        <TextInput
          value={form[key]}
          onChangeText={(text) => setForm((f) => ({ ...f, [key]: text }))}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
          style={[textStyles.h3, { color: colors.textPrimary, flex: 1, textAlign: 'left', padding: 0, fontSize: 16 }, { outlineStyle: 'none' } as any]}
        />
      );
    }
    return undefined;
  };

  const getRightText = (key: keyof typeof form, fallback = '') => {
    if (isEditing) return undefined;
    const value = profile?.[key as keyof typeof profile];
    if (!value) return fallback;
    if (key === 'dob' || key === 'semesterStartDate' || key === 'semesterEndDate') {
      try {
        const d = new Date(value as string);
        if (!isNaN(d.getTime())) return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
      } catch (e) {}
      return value as string;
    }
    if (key === 'currentSemester') return `Semester - ${value}`;
    if (key === 'branch') return value as string;
    if (key === 'section') return `Section ${value}`;
    return value as string;
  };

  const currentSemesterNum = profile?.currentSemester;
  const semesterStr = currentSemesterNum ? `${currentSemesterNum}${currentSemesterNum === 1 ? 'st' : currentSemesterNum === 2 ? 'nd' : currentSemesterNum === 3 ? 'rd' : 'th'} Semester` : 'Enter Semester';

  const handleGraduation = () => {
    const currentSemNum = profile?.currentSemester || 1;
    const nextSem = currentSemNum + 1;
    
    // --- VALIDATION: Check if grade tracker is complete for current semester ---
    const academicStore = useAcademicStore.getState();
    const currentAcademicSem = academicStore.semesters.find(s => s.number === currentSemNum);
    
    if (!currentAcademicSem) {
      // No academic data at all for current semester
      Alert.alert(
        'Grade Tracker Incomplete',
        `Please fill in your SGPA details for Semester ${currentSemNum} in the Grade Tracker before graduating.`
      );
      return;
    }
    
    const sgpaSubjects = currentAcademicSem.sgpaSubjects || [];
    
    // Check if there are subjects and they all have required data
    if (sgpaSubjects.length === 0) {
      Alert.alert(
        'Grade Tracker Incomplete',
        `Please add subjects and their grades for Semester ${currentSemNum} in the Grade Tracker before graduating.`
      );
      return;
    }
    
    // Check each subject has name, credits, and grade point
    const incompleteSubjects = sgpaSubjects.filter(sub => {
      const hasName = sub.name && sub.name.trim() !== '';
      const hasCredits = parseFloat(sub.credits) > 0;
      const hasGradePoint = parseFloat(sub.gradePoint) > 0;
      return hasName && (!hasCredits || !hasGradePoint);
    });
    
    if (incompleteSubjects.length > 0) {
      const names = incompleteSubjects.map(s => s.name).join(', ');
      Alert.alert(
        'Grade Tracker Incomplete',
        `The following subjects are missing credits or grade points: ${names}. Please complete them before graduating.`
      );
      return;
    }
    
    // Check if SGPA has been calculated (should be > 0)
    if (!currentAcademicSem.sgpa || currentAcademicSem.sgpa <= 0) {
      Alert.alert(
        'Save SGPA First',
        `Please save your SGPA for Semester ${currentSemNum} in the Grade Tracker before graduating.`
      );
      return;
    }
    
    // --- All validations passed, proceed with graduation ---
    Alert.alert(
      "Confirm Graduation",
      `Graduate from Semester ${currentSemNum} to Semester ${nextSem}?\n\nYour Semester ${currentSemNum} SGPA: ${currentAcademicSem.sgpa.toFixed(2)}\n\nThis will move you to the new semester. Your old data is preserved and accessible via the Grade Tracker.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: `Graduate to Sem ${nextSem}`, 
          onPress: () => {
            // Update profile to new semester
            updateProfile({ currentSemester: nextSem });
            
            // Mark old semester as not current in academic store
            const existingNewSem = academicStore.semesters.find(s => s.number === nextSem);
            if (existingNewSem) {
              academicStore.setCurrentSemester(existingNewSem.id);
            } else {
              academicStore.addSemester({
                name: `Semester ${nextSem}`,
                number: nextSem,
                isCurrent: true,
              });
            }

            Alert.alert("Congratulations! 🎉", `You are now in Semester ${nextSem}. Add your new subjects to get started.`);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 40, height: 40, justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[textStyles.h2, { color: colors.textPrimary, flex: 1, textAlign: 'center' }]}>My Profile</Text>
        <Pressable onPress={toggleEdit} hitSlop={12} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' }}>
          <Ionicons name={isEditing ? "checkmark" : "create-outline"} size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <ProfileViewCard
          name={profile?.name || 'Student Name'}
          enrollmentNumber={profile?.enrollmentNumber || 'Enter Roll Number'}
          branch={profile?.branch || 'Enter Branch'}
          semesterStr={semesterStr}
          college={profile?.college || ''}
          section={profile?.section || ''}
          currentSGPA={displayedSGPA}
          cgpa={cgpa}
          completedCredits={completedCredits}
          avatarUri={profile?.avatarUri}
          isPredictedSGPA={isPredictedSGPA}
          onAvatarPress={handlePickAvatar}
          onAvatarLongPress={handlePickAvatar}
        />

        {/* Personal Information */}
        <Animated.View entering={FadeInDown.delay(20).duration(100)}>
          <SectionTitle title="Personal Information" />
          <View style={{ paddingHorizontal: spacing.xl }}>
            <Card variant="flat" padding={20} style={{ borderRadius: 24 }}>
              <View style={{ gap: 20 }}>
                <ProfileField icon="person-outline" label="Full Name" value={getRightText('name')} isEditing={isEditing} renderEdit={renderRight('name', 'Enter Full Name')} />
                <ProfileField icon="mail-outline" label="Email" value={getRightText('email')} isEditing={isEditing} renderEdit={renderRight('email', 'Enter Email Address', 'email-address')} />
                <ProfileField icon="calendar-outline" label="Date of Birth" value={getRightText('dob')} isEditing={isEditing} renderEdit={renderRight('dob', 'Select Date of Birth')} onPress={isEditing ? () => setShowDatePicker('dob') : undefined} />
                <ProfileField icon="card-outline" label="Roll Number" value={getRightText('enrollmentNumber')} isEditing={isEditing} renderEdit={renderRight('enrollmentNumber', 'Enter Roll Number')} />
              </View>
            </Card>
          </View>
        </Animated.View>

        {/* Academic Details */}
        <Animated.View entering={FadeInDown.delay(20).duration(100)}>
          <SectionTitle title="Academic Details" />
          <View style={{ paddingHorizontal: spacing.xl }}>
            <Card variant="flat" padding={20} style={{ borderRadius: 24 }}>
              <View style={{ gap: 20 }}>
                <ProfileField icon="business-outline" label="College Name" value={getRightText('college')} isEditing={isEditing} renderEdit={renderRight('college', 'Enter College Name')} />
                <ProfileField icon="git-branch-outline" label="Branch" value={getRightText('branch')} isEditing={isEditing} renderEdit={renderRight('branch', 'Enter Branch')} />
                <ProfileField icon="school-outline" label="Current Semester" value={getRightText('currentSemester')} isEditing={isEditing} renderEdit={renderRight('currentSemester', 'Enter Semester', 'numeric')} />
                <ProfileField icon="time-outline" label="Semester Start" value={getRightText('semesterStartDate')} isEditing={isEditing} renderEdit={renderRight('semesterStartDate', 'Select Start Date')} onPress={isEditing ? () => setShowDatePicker('semesterStartDate') : undefined} />
                <ProfileField icon="time-outline" label="Semester End" value={getRightText('semesterEndDate')} isEditing={isEditing} renderEdit={renderRight('semesterEndDate', 'Select End Date')} onPress={isEditing ? () => setShowDatePicker('semesterEndDate') : undefined} />
              </View>
            </Card>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(20).duration(100)} style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
          <Pressable 
            onPress={handleGraduation}
            style={({ pressed }) => ({
              backgroundColor: colors.primary + '15',
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.primary + '30',
              opacity: pressed ? 0.7 : 1
            })}
          >
            <Text style={[textStyles.h3, { color: colors.primary }]}>
              🎓 Graduate Semester {profile?.currentSemester || 1}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {showDatePicker && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingBottom: Platform.OS === 'ios' ? 40 : 20, zIndex: 1000, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
            <Pressable onPress={() => setShowDatePicker(null)}>
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 16 }}>Done</Text>
            </Pressable>
          </View>
          <View style={{ alignItems: 'center', width: '100%' }}>
            <DateTimePicker
              value={form[showDatePicker as keyof typeof form] ? new Date(form[showDatePicker as keyof typeof form] as string) : new Date()}
              mode="date"
              display="inline"
              onValueChange={(event, date) => {
                if (Platform.OS === 'android') setShowDatePicker(null);
                setForm(f => ({ ...f, [showDatePicker]: date.toISOString().split('T')[0] }));
              }}
              onDismiss={() => {
                if (Platform.OS === 'android') setShowDatePicker(null);
              }}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
