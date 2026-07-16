// Campora — Profile Screen

import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/theme';
import { Card, ListRow } from '@/components/ui';
import { useProfileStore, useAcademicStore } from '@/stores';
import { ProfileViewCard } from './components/ProfileViewCard';

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
  const cgpa = useAcademicStore(s => s.getCGPA());
  const gradeEntries = useAcademicStore(s => s.gradeEntries);
  const completedCredits = gradeEntries.reduce((sum, e) => sum + e.credits, 0);

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
      updateProfile({ ...form, currentSemester: parseInt(form.currentSemester) || 1 });
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

  const renderRight = (key: keyof typeof form, placeholder: string, keyboardType: any = 'default') => {
    if (isEditing) {
      if (key === 'semesterStartDate' || key === 'semesterEndDate' || key === 'dob') {
        return (
          <Pressable onPress={() => setShowDatePicker(key)}>
            <Text style={[textStyles.small, { color: form[key] ? colors.textPrimary : colors.textTertiary, textAlign: 'right' }]}>{form[key] || placeholder}</Text>
          </Pressable>
        );
      }
      return (
        <TextInput
          value={form[key]}
          onChangeText={(text) => setForm((f) => ({ ...f, [key]: text }))}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
          style={[textStyles.small, { color: colors.textPrimary, flex: 1, textAlign: 'right', padding: 0 }, { outlineStyle: 'none' } as any]}
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
    if (key === 'branch') return `Branch ${value}`;
    if (key === 'section') return `Section ${value}`;
    return value as string;
  };

  const currentSemesterNum = profile?.currentSemester;
  const semesterStr = currentSemesterNum ? `${currentSemesterNum}${currentSemesterNum === 1 ? 'st' : currentSemesterNum === 2 ? 'nd' : currentSemesterNum === 3 ? 'rd' : 'th'} Semester` : 'Enter Semester';

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
          name={profile?.name || 'Enter Name'}
          enrollmentNumber={profile?.enrollmentNumber || 'Enter Roll Number'}
          branch={profile?.branch || 'Enter Branch'}
          semesterStr={semesterStr}
          college={profile?.college || 'Enter College'}
          section={profile?.section || 'Enter Section'}
          currentSGPA={currentSGPA}
          cgpa={cgpa}
          completedCredits={completedCredits}
        />

        {/* Personal Information */}
        <Animated.View entering={FadeInDown.delay(20).duration(100)}>
          <SectionTitle title="Personal Information" />
          <View style={{ paddingHorizontal: spacing.xl }}>
            <Card variant="flat" padding={0}>
              <ListRow icon="person-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight} title="Full Name" rightText={getRightText('name')} rightElement={renderRight('name', 'Enter Full Name')} showChevron={false} />
              <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
              <ListRow icon="mail-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight} title="Email" rightText={getRightText('email')} rightElement={renderRight('email', 'Enter Email Address', 'email-address')} showChevron={false} />
              <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
              <ListRow icon="calendar-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight} title="Date of Birth" rightText={getRightText('dob')} rightElement={renderRight('dob', 'Select Date of Birth')} showChevron={false} />
              <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
              <ListRow icon="card-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight} title="Roll Number" rightText={getRightText('enrollmentNumber')} rightElement={renderRight('enrollmentNumber', 'Enter Roll Number')} showChevron={false} />
            </Card>
          </View>
        </Animated.View>

        {/* Academic Details */}
        <Animated.View entering={FadeInDown.delay(20).duration(100)}>
          <SectionTitle title="Academic Details" />
          <View style={{ paddingHorizontal: spacing.xl }}>
            <Card variant="flat" padding={0}>
              <ListRow icon="business-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight} title="College Name" rightText={getRightText('college')} rightElement={renderRight('college', 'Enter College Name')} showChevron={false} />
              <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
              <ListRow icon="git-branch-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight} title="Branch" rightText={getRightText('branch')} rightElement={renderRight('branch', 'Enter Branch')} showChevron={false} />
              <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
              <ListRow icon="school-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight} title="Current Semester" rightText={getRightText('currentSemester')} rightElement={renderRight('currentSemester', 'Enter Semester', 'numeric')} showChevron={false} />
              <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
              <ListRow icon="time-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight} title="Semester Start" rightText={getRightText('semesterStartDate')} rightElement={renderRight('semesterStartDate', 'Select Start Date')} showChevron={false} />
              <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
              <ListRow icon="time-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight} title="Semester End" rightText={getRightText('semesterEndDate')} rightElement={renderRight('semesterEndDate', 'Select End Date')} showChevron={false} />
            </Card>
          </View>
        </Animated.View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={form[showDatePicker as keyof typeof form] ? new Date(form[showDatePicker as keyof typeof form] as string) : new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(null);
            if (date) setForm(f => ({ ...f, [showDatePicker]: date.toISOString().split('T')[0] }));
          }}
        />
      )}
    </SafeAreaView>
  );
}
