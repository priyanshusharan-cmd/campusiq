// Campora — Create New Subject Modal
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, KeyboardAvoidingView, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useSubjectStore } from '@/stores/useSubjectStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { getSubjectTheme } from '@/utils/subjectTheme';
import { DEFAULTS } from '@/constants';
import type { SubjectType } from '@/types';

import { TextInput, Select, ColorPicker, SegmentedControl, IconPicker } from '@/components/form';

export default function CreateSubjectScreen() {
  const { colors, spacing, textStyles, isDark } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const subjectId = Array.isArray(id) ? id[0] : id;

  const { addSubject, updateSubject, getSubject } = useSubjectStore();
  const existingSubject = subjectId ? getSubject(subjectId) : undefined;
  const isEditing = !!existingSubject;

  const [name, setName] = useState(existingSubject?.name || '');
  const [code, setCode] = useState(existingSubject?.code || '');
  const [credits, setCredits] = useState(existingSubject?.credits || 1);
  const [faculty, setFaculty] = useState(existingSubject?.faculty || '');
  const [description, setDescription] = useState('');
  const [subjectType, setSubjectType] = useState<SubjectType>(existingSubject?.type || 'theory');
  const [userColor, setUserColor] = useState<string | undefined>(existingSubject?.color);
  const [icon, setIcon] = useState<string | undefined>(existingSubject?.icon);
  
  const { icon: autoIcon, color: autoColor } = getSubjectTheme(name, code, false, userColor, icon);
  
  const profile = useProfileStore(state => state.profile);

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Subject name is required');
      return;
    }

    const currentSemesterId = profile?.currentSemester?.toString() || '1';
    const allSubjects = useSubjectStore.getState().subjects;
    
    // Calculate total credits for the current semester
    let totalCredits = allSubjects
      .filter(s => s.semesterId === currentSemesterId && s.id !== subjectId)
      .reduce((sum, s) => sum + s.credits, 0);

    if (totalCredits + credits > DEFAULTS.maxCreditsPerSemester) {
      Alert.alert(
        'Credit Limit Exceeded', 
        `You cannot exceed ${DEFAULTS.maxCreditsPerSemester} credits in a single semester. Current total is ${totalCredits}.`
      );
      return;
    }
    
    if (isEditing && subjectId) {
      updateSubject(subjectId, {
        name,
        code,
        faculty,
        type: subjectType,
        credits,
        color: autoColor,
        icon
      });
    } else {
      addSubject({
        name,
        code,
        faculty,
        type: subjectType,
        credits,
        semesterId: profile?.currentSemester?.toString() || '1',
        color: autoColor,
        icon
      });
    }
    
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerContent}>
          <View>
            <Text style={[textStyles.h1, { color: colors.textPrimary }]}>{isEditing ? 'Edit Subject' : 'Create New Subject'}</Text>
            <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 4, fontSize: 13 }]}>
              {isEditing ? 'Update the details of your subject' : 'Add a new subject to track'}
            </Text>
          </View>
          <View style={[styles.headerIconWrap, { backgroundColor: `${autoColor}20` }]}>
            <Ionicons name={autoIcon as any} size={24} color={autoColor} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Tip Banner */}
          <View style={[styles.tipBanner, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5', borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="bulb-outline" size={16} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={[textStyles.smallMedium, { color: '#10B981' }]}>Quick Tip</Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                Add all your subjects to get accurate attendance and GPA insights.
              </Text>
            </View>
          </View>

          {/* Form */}
          <TextInput 
            label="Subject Name" 
            required 
            placeholder="Enter Subject Name" 
            value={name}
            onChangeText={setName}
          />
          
          <TextInput 
            label="Subject Code" 
            placeholder="Enter Subject Code" 
            value={code}
            onChangeText={setCode}
          />          
          {/* Credits Stepper (Simulated with Select for now or Custom UI) */}
          <View style={styles.inputGroup}>
            <Text style={[textStyles.smallMedium, { color: colors.textPrimary, marginBottom: 8 }]}>
              Credits <Text style={{ color: colors.danger }}>*</Text>
            </Text>
            <View style={[styles.stepper, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Pressable style={styles.stepBtn} onPress={() => setCredits(Math.max(1, credits - 1))}>
                <Ionicons name="remove" size={20} color={colors.textSecondary} />
              </Pressable>
              <Text style={{ fontSize: 16, fontWeight: '500', color: colors.textPrimary }}>{credits}</Text>
              <Pressable style={styles.stepBtn} onPress={() => setCredits(Math.min(10, credits + 1))}>
                <Ionicons name="add" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
          
          <SegmentedControl
            label="Subject Type"
            required
            value={subjectType}
            onChange={(val) => setSubjectType(val as SubjectType)}
            options={[
              { label: 'Theory Only', value: 'theory', icon: 'book-outline' },
              { label: 'Theory + Practical', value: 'lab', icon: 'flask-outline' },
            ]}
          />

          <TextInput 
            label="Faculty" 
            placeholder="Enter Faculty Name" 
            value={faculty}
            onChangeText={setFaculty}
          />
          
          <TextInput 
            label="Description" 
            placeholder="Brief description about this subject..." 
            value={description}
            onChangeText={setDescription}
            multiline 
            numberOfLines={4} 
          />
          
          <ColorPicker label="Color" value={autoColor} onChange={setUserColor} />

          <IconPicker 
            label="Subject Icon" 
            value={autoIcon} 
            onChange={setIcon} 
            selectedColor={autoColor} 
          />

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.borderLight, backgroundColor: colors.bg }]}>
        <Pressable 
          style={[styles.submitBtn, { backgroundColor: '#10B981' }]}
          onPress={handleCreate}
        >
          <Ionicons name={isEditing ? "save-outline" : "add-circle-outline"} size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{isEditing ? 'Save Changes' : 'Create Subject'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    marginBottom: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  inputGroup: {
    marginBottom: 20,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: 140,
  },
  stepBtn: {
    padding: 4,
  },
  semCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  }
});
