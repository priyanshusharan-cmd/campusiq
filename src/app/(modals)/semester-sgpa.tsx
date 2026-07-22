import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Dimensions, KeyboardAvoidingView, Platform, Alert, Switch } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { useAcademicStore, useSubjectStore } from '@/stores';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getGPALabel } from '@/lib';

const { width } = Dimensions.get('window');

type SubjectEntry = {
  id: string;
  name: string;
  code: string;
  credits: string;
  totalMarks: string;
  gradePoint: string;
};

function marksToGradePoint(marks: number): number {
  if (marks >= 90) return 10;
  if (marks >= 80) return 9;
  if (marks >= 70) return 8;
  if (marks >= 60) return 7;
  if (marks >= 50) return 6;
  if (marks >= 45) return 5;
  if (marks >= 40) return 4;
  return 0;
}

// Reusable beautifully styled Input with focus state
const InputField = ({ label, style, containerStyle, highlight = false, onFocus, onBlur, ...props }: any) => {
  const { colors, textStyles } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  
  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const isActive = isFocused || highlight;

  return (
    <View style={[{ flex: 1 }, containerStyle]}>
      <Text style={[textStyles.small, { color: isActive ? colors.primary : colors.textSecondary, marginBottom: 6, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' }]}>{label}</Text>
      <View style={[styles.inputContainer, { borderColor: isActive ? colors.primary + '50' : colors.borderLight, backgroundColor: isActive ? colors.primary + '10' : colors.bg }]}>
        <TextInput 
          style={[styles.input, { color: isActive ? colors.primary : colors.textPrimary }, style]} 
          placeholderTextColor={colors.textQuaternary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props} 
        />
      </View>
    </View>
  );
};

export default function SemesterSGPAScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();
  const { semNumber } = useLocalSearchParams<{ semNumber: string }>();
  
  const semesters = useAcademicStore(s => s.semesters);
  const updateSemester = useAcademicStore(s => s.updateSemester);
  const addSemester = useAcademicStore(s => s.addSemester);
  
  const passingMarks = useSettingsStore(s => s.passingMarks);

  const semesterNum = parseInt(semNumber || '1', 10);
  const existingSem = semesters.find(s => s.number === semesterNum);
  
  const allSubjects = useSubjectStore(s => s.subjects);
  
  const initialSubjects = useMemo(() => {
    // Step 1: Get subjects for this specific semester number
    const semStr = semesterNum.toString();
    const semSubjects = allSubjects.filter(s => s.semesterId === semStr);

    // Step 2: Get any saved SGPA subjects from the academic store
    const savedSubjects = existingSem?.sgpaSubjects || [];

    if (savedSubjects.length === 0 && semSubjects.length === 0) {
      // No data at all — show one blank row
      return [{ id: Date.now().toString(), name: '', code: '', credits: '', totalMarks: '', gradePoint: '' }];
    }

    if (savedSubjects.length === 0 && semSubjects.length > 0) {
      // Subjects exist from "Create Subject" but no grade tracker data yet
      return semSubjects.map(s => ({
        id: s.id,
        name: s.name,
        code: s.code || '',
        credits: (s.credits || 0).toString(),
        totalMarks: '',
        gradePoint: ''
      }));
    }

    // savedSubjects has data — merge with any new subjects not already in saved
    const merged = [...savedSubjects];
    semSubjects.forEach(s => {
      const existsById = merged.find(saved => saved.id === s.id);
      const existsByName = merged.find(saved => 
        saved.name.trim().toLowerCase() === s.name.trim().toLowerCase() && saved.name.trim() !== ''
      );
      if (!existsById && !existsByName) {
        merged.push({
          id: s.id,
          name: s.name,
          code: s.code || '',
          credits: (s.credits || 0).toString(),
          totalMarks: '',
          gradePoint: ''
        });
      }
    });

    return merged;
  }, [allSubjects, existingSem, semesterNum]);

  const [subjects, setSubjects] = useState<SubjectEntry[]>(initialSubjects);

  const addSubject = () => {
    setSubjects([...subjects, { id: Date.now().toString(), name: '', code: '', credits: '', totalMarks: '', gradePoint: '' }]);
  };

  const removeSubject = (id: string) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const updateSubject = (id: string, field: keyof SubjectEntry, value: any) => {
    setSubjects(subjects.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: value };
      
      if (field === 'totalMarks') {
        let marks = parseFloat(updated.totalMarks) || 0;
        
        if (marks > 0) {
          updated.gradePoint = marksToGradePoint(marks).toString();
        } else if (updated.totalMarks === '') {
          updated.gradePoint = '';
        }
      }
      return updated;
    }));
  };

  const { sgpa, totalCredits, backlogCount, backlogCredits } = useMemo(() => {
    let pts = 0;
    let creds = 0;
    let bCount = 0;
    let bCreds = 0;

    subjects.forEach(sub => {
      const c = parseFloat(sub.credits) || 0;
      const gp = parseFloat(sub.gradePoint) || 0;
      const marks = parseFloat(sub.totalMarks) || 0;
      
      if (c > 0 && gp > 0) {
        creds += c;
        pts += (gp * c);
        
        if (marks > 0 && marks < passingMarks) {
          bCount++;
          bCreds += c;
        }
      }
    });

    return {
      sgpa: creds > 0 ? Math.round((pts / creds) * 100) / 100 : 0.0,
      totalCredits: creds,
      backlogCount: bCount,
      backlogCredits: bCreds
    };
  }, [subjects, passingMarks]);

  useEffect(() => {
    // Auto-save ONLY the academic store data (subjects list, sgpa, credits)
    // Do NOT create SubjectStore subjects here (that happens on explicit Save)
    const currentSem = useAcademicStore.getState().semesters.find(s => s.number === semesterNum);
    
    // Only auto-save if there's meaningful data (at least one subject with a name)
    const hasMeaningfulData = subjects.some(s => s.name.trim() !== '');
    if (!hasMeaningfulData) return;
    
    if (currentSem) {
      updateSemester(currentSem.id, { sgpa, totalCredits, backlogCount, backlogCredits, sgpaSubjects: subjects });
    } else {
      addSemester({ name: `Semester ${semesterNum}`, number: semesterNum, isCurrent: false, sgpa, totalCredits, backlogCount, backlogCredits, sgpaSubjects: subjects });
    }
  }, [subjects, sgpa, totalCredits, backlogCount, backlogCredits, semesterNum]);

  const handleSave = () => {
    if (totalCredits === 0) {
      Alert.alert('Incomplete', 'Please enter credits and grade points/marks to calculate SGPA.');
      return;
    }

    // Save to academic store
    if (existingSem) {
      updateSemester(existingSem.id, { sgpa, totalCredits, backlogCount, backlogCredits, sgpaSubjects: subjects });
    } else {
      addSemester({ name: `Semester ${semesterNum}`, number: semesterNum, isCurrent: false, sgpa, totalCredits, backlogCount, backlogCredits, sgpaSubjects: subjects });
    }

    // --- TWO-WAY SYNC: Create subjects in SubjectStore if they don't exist ---
    const subjectStore = useSubjectStore.getState();
    const semStr = semesterNum.toString();
    const existingSubjectsForSem = subjectStore.subjects.filter(s => s.semesterId === semStr);

    subjects.forEach(sub => {
      if (!sub.name.trim()) return; // Skip blank entries

      // Check if subject already exists by ID or name
      const existsById = existingSubjectsForSem.find(s => s.id === sub.id);
      const existsByName = existingSubjectsForSem.find(s => 
        s.name.trim().toLowerCase() === sub.name.trim().toLowerCase()
      );

      if (!existsById && !existsByName) {
        // Create subject in SubjectStore
        subjectStore.addSubject({
          name: sub.name,
          code: sub.code || '',
          credits: parseFloat(sub.credits) || 3,
          semesterId: semStr,
        });
      }
    });

    Alert.alert('Success 🎉', 'Semester SGPA has been saved successfully.', [
      { text: 'Awesome!', onPress: () => router.back() }
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.bg }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.borderLight }]} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Semester {semesterNum} SGPA</Text>
        <Pressable 
          onPress={() => {
            Alert.alert(
              'Clear Subjects',
              `Are you sure you want to clear all subjects for Semester ${semesterNum}? This will remove all grade data for this semester.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Clear All', 
                  style: 'destructive', 
                  onPress: () => {
                    setSubjects([{ id: Date.now().toString(), name: '', code: '', credits: '', totalMarks: '', gradePoint: '' }]);
                    // Also clear from academic store
                    if (existingSem) {
                      updateSemester(existingSem.id, { sgpa: 0, totalCredits: 0, backlogCount: 0, backlogCredits: 0, sgpaSubjects: [] });
                    }
                  }
                }
              ]
            );
          }} 
          style={[styles.iconBtn, { backgroundColor: colors.borderLight }]} 
          hitSlop={12}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 140, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeInDown.delay(0).duration(200)} style={styles.topStats}>
            <LinearGradient colors={['#8B5CF6', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.statBoxGradient, { flex: 1.3 }]}>
              <Text style={[textStyles.smallMedium, { color: 'rgba(255,255,255,0.8)', marginBottom: 4 }]}>Calculated SGPA</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
                <Text style={[textStyles.display, { color: '#FFF', fontSize: 36, lineHeight: 40 }]}>{sgpa > 0 ? sgpa.toFixed(2) : '--'}</Text>
                {sgpa > 0 && <View style={styles.badge}><Text style={[textStyles.small, { color: '#FFF', fontWeight: 'bold' }]}>{getGPALabel(sgpa)}</Text></View>}
              </View>
            </LinearGradient>
            <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 4 }]}>Credits</Text>
              <Text style={[textStyles.display, { color: colors.textPrimary, fontSize: 36, lineHeight: 40 }]}>{totalCredits}</Text>
            </View>
          </Animated.View>

          {subjects.map((sub, index) => (
            <Animated.View key={sub.id} entering={FadeInDown.delay(index * 40 + 100).duration(250).springify()} style={[styles.subjectCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.subjectAvatar, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>{index + 1}</Text>
                  </View>
                  <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Subject {index + 1}</Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {(() => {
                     const marks = parseFloat(sub.totalMarks) || 0;
                     if (marks > 0) {
                       const isBacklog = marks < passingMarks;
                       return (
                         <View style={{ backgroundColor: isBacklog ? '#FEF2F2' : '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: isBacklog ? '#FCA5A5' : '#6EE7B7' }}>
                           <Text style={[textStyles.smallMedium, { color: isBacklog ? '#DC2626' : '#059669', fontSize: 11 }]}>{isBacklog ? 'BACKLOG' : 'PASSED'}</Text>
                         </View>
                       );
                     }
                     return null;
                  })()}
                  {subjects.length > 1 && (
                    <Pressable onPress={() => removeSubject(sub.id)} hitSlop={15} style={styles.trashBtn}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.row}>
                <InputField 
                  label="Subject Name" 
                  placeholder="Subject Name"
                  value={sub.name}
                  onChangeText={(val: string) => updateSubject(sub.id, 'name', val)}
                />
              </View>

              <View style={[styles.row, { marginTop: 16 }]}>
                <InputField 
                  label="Code" 
                  placeholder="Subject Code"
                  value={sub.code}
                  onChangeText={(val: string) => updateSubject(sub.id, 'code', val)}
                />
              </View>

              <View style={[styles.row, { marginTop: 16 }]}>
                <InputField 
                  label="Credits" 
                  placeholder="0"
                  keyboardType="numeric"
                  value={sub.credits}
                  onChangeText={(val: string) => updateSubject(sub.id, 'credits', val)}
                />
                <InputField 
                  label="Grade Pt." 
                  placeholder="10"
                  keyboardType="numeric"
                  style={{ fontWeight: '700', fontSize: 16 }}
                  value={sub.gradePoint}
                  onChangeText={(val: string) => updateSubject(sub.id, 'gradePoint', val)}
                />
                
                <InputField 
                  label="Marks" 
                  placeholder="Auto-fills GP"
                  keyboardType="numeric"
                  value={sub.totalMarks}
                  onChangeText={(val: string) => updateSubject(sub.id, 'totalMarks', val)}
                  containerStyle={{ flex: 1.4 }}
                />
              </View>
            </Animated.View>
          ))}

          <Animated.View entering={FadeInUp.delay(300).duration(200)}>
            <Pressable 
              style={({ pressed }) => [
                styles.addBtn, 
                { borderColor: colors.primary + '30', backgroundColor: colors.primary + '08', opacity: pressed ? 0.7 : 1 }
              ]}
              onPress={addSubject}
            >
              <View style={[styles.addIconWrap, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="add" size={18} color={colors.primary} style={{ fontWeight: 'bold' }} />
              </View>
              <Text style={[textStyles.bodyMedium, { color: colors.primary, fontWeight: '700' }]}>Add Another Subject</Text>
            </Pressable>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
        <LinearGradient
          colors={totalCredits > 0 ? ['#8B5CF6', '#6366F1'] : ['#E5E7EB', '#D1D5DB']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.calculateBtnGradient}
        >
          <Pressable 
            style={({ pressed }) => [
              styles.calculateBtn, 
              { opacity: pressed ? 0.8 : 1 }
            ]}
            onPress={handleSave}
            disabled={totalCredits === 0}
          >
            <Ionicons name="save" size={20} color={totalCredits > 0 ? "#FFF" : "#9CA3AF"} style={{ marginRight: 10 }} />
            <Text style={[textStyles.h3, { color: totalCredits > 0 ? '#FFF' : '#9CA3AF', fontWeight: '700' }]}>Save SGPA</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  topStats: { flexDirection: 'row', gap: 12, marginBottom: 24, paddingHorizontal: 4, alignItems: 'stretch' },
  statBoxGradient: { padding: 20, borderRadius: 24, justifyContent: 'center', shadowColor: '#7C5CFC', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  statBox: { flex: 1, padding: 20, borderRadius: 24, borderWidth: 1, justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 6 },
  subjectCard: { padding: 20, borderRadius: 28, borderWidth: 1, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  subjectAvatar: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  trashBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  inputContainer: { height: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, justifyContent: 'center' },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },

  addBtn: { flexDirection: 'row', height: 60, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  addIconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 36 : 24, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', backgroundColor: 'rgba(255,255,255,0.95)' },
  calculateBtnGradient: { borderRadius: 20, shadowColor: '#7C5CFC', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  calculateBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 60 },
});
