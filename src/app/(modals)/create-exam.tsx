// Campora — Create Exam Modal
// Bumping file for Metro Cache
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui';
import { useExamStore, useSubjectStore, useActiveSubjects } from '@/stores';
import type { ExamType } from '@/types';

export default function CreateExamModal() {
  const { colors, spacing, textStyles, radius } = useTheme();
  const router = useRouter();
  
  const subjects = useActiveSubjects();
  const addExam = useExamStore(s => s.addExam);
  
  const [ setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<ExamType>('midsem');
  const [syllabus, setSyllabus] = useState('');

  const handleSave = () => {
    if (!subjectId) return;
    addExam({
      subjectId,
      date,
      type,
      syllabus,
    });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={[textStyles.h2, { color: colors.textPrimary, flex: 1, textAlign: 'center' }]}>New Exam</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>



      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          

        <View>
          <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 8 }]}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.borderLight, color: colors.textPrimary }]}
            value={date}
            onChangeText={setDate}
          />
        </View>
        
        <View>
          <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 8 }]}>Subject</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {subjects.map(s => (
              <Pressable
                key={s.id}
                onPress={() => setSubjectId(s.id)}
                style={[
                  styles.pill,
                  { backgroundColor: subjectId === s.id ? colors.primary : colors.surface, borderColor: subjectId === s.id ? colors.primary : colors.borderLight }
                ]}
              >
                <Text style={{ color: subjectId === s.id ? '#fff' : colors.textPrimary }}>{s.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 8 }]}>Type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(['midsem', 'endsem', 'quiz', 'viva', 'practical', 'assignment'] as ExamType[]).map(p => (
              <Pressable
                key={p}
                onPress={() => setType(p)}
                style={[
                  styles.pill,
                  { backgroundColor: type === p ? colors.primary : colors.surface, borderColor: type === p ? colors.primary : colors.borderLight }
                ]}
              >
                <Text style={{ color: type === p ? '#fff' : colors.textPrimary }}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={styles.btn} onPress={handleSave}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Save Exam</Text>
        </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  btn: {
    marginTop: 24,
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  }
});
