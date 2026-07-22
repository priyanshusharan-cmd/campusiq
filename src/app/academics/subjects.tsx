import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Alert, Modal } from 'react-native';
import { ScrollView, Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { cacheDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { useSubjectStore, useTimetableStore, useActiveSubjects, useProfileStore } from '@/stores';

export default function SubjectsListScreen() {
  const { colors, spacing, textStyles, isDark } = useTheme();
  const router = useRouter();
  const subjects = useActiveSubjects();
  const removeSubject = useSubjectStore(s => s.removeSubject);
  const timetableEntries = useTimetableStore(s => s.entries);
  const [selectedActionSubject, setSelectedActionSubject] = useState<any | null>(null);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Subject',
      `Are you sure you want to delete ${name}? This will also delete related attendance and timetable records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => removeSubject(id) 
        }
      ]
    );
  };

  const handleExport = async () => {
    if (subjects.length === 0) {
      Alert.alert('No Subjects', 'There are no subjects to export.');
      return;
    }

    try {
      const profile = useProfileStore.getState().profile;
      const semesterStr = profile?.currentSemester || 1;
      const branchStr = profile?.branch ? profile.branch.replace(/[^a-zA-Z0-9]/g, '') : 'Branch';
      const collegeStr = profile?.college ? profile.college.replace(/[^a-zA-Z0-9]/g, '') : 'College';
      
      const fileName = `subjects_semester${semesterStr}_${branchStr}_${collegeStr}.campusiq`;
      const fileUri = `${cacheDirectory}${fileName}`;
      
      const exportData = {
        type: 'campusiq_subjects',
        version: '1.0',
        semester: profile?.currentSemester || 1,
        branch: profile?.branch,
        college: profile?.college,
        subjects: subjects.map(s => ({
          name: s.name,
          code: s.code,
          credits: s.credits,
          type: s.type,
          faculty: s.faculty,
          color: s.color,
          icon: s.icon,
        }))
      };

      await writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2), {
        encoding: EncodingType.UTF8
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export CampusIQ Subjects',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Error exporting subjects:', error);
      Alert.alert('Export Error', 'Failed to export subjects.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSecondary }} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.borderLight }]} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[textStyles.h2, { color: colors.textPrimary, flex: 1, textAlign: 'center' }]}>Subjects</Text>
        <Pressable 
          onPress={handleExport}
          style={[styles.iconBtn, { backgroundColor: colors.surfaceHover }]}
          hitSlop={12}
        >
          <Ionicons name="share-outline" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {subjects.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="book-outline" size={48} color={colors.primary} />
            </View>
            <Text style={[textStyles.h3, { color: colors.textPrimary, marginTop: 16 }]}>No Subjects Yet</Text>
            <Text style={[textStyles.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 8, marginHorizontal: 32 }]}>
              Add your subjects to manage attendance, grades, and timetable.
            </Text>
          </View>
        ) : (
          subjects.map((subject, index) => {
            const renderRightActions = () => (
              <Pressable 
                style={{
                  backgroundColor: '#EF4444',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  width: 90,
                  marginBottom: 12,
                  borderRadius: 16,
                  paddingRight: 24,
                  marginLeft: -20, // Slide under effect
                }}
                onPress={() => handleDelete(subject.id, subject.name)}
              >
                <Ionicons name="trash-outline" size={24} color="#FFF" />
              </Pressable>
            );

            const renderLeftActions = () => (
              <Pressable 
                style={{
                  backgroundColor: '#3B82F6',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  width: 90,
                  marginBottom: 12,
                  borderRadius: 16,
                  paddingLeft: 24,
                  marginRight: -20,
                }}
                onPress={() => router.push(`/(modals)/create-subject?id=${subject.id}` as any)}
              >
                <Ionicons name="pencil-outline" size={24} color="#FFF" />
              </Pressable>
            );

            const subjectEntries = timetableEntries.filter(e => e.subjectId === subject.id);
            const hasLab = subjectEntries.some(e => e.type === 'lab');

            let displayType = 'Theory';
            let bgColor = isDark ? '#4338CA40' : '#E0E7FF';
            let textColor = isDark ? '#A5B4FC' : '#4338CA';

            if (hasLab) {
              displayType = 'Theory & Lab';
              bgColor = isDark ? '#7E22CE40' : '#F3E8FF'; // Purple bg
              textColor = isDark ? '#D8B4FE' : '#7E22CE'; // Purple text
            } else if (subject.type === 'elective') {
              displayType = 'Elective';
              bgColor = isDark ? '#B4530940' : '#FEF3C7';
              textColor = isDark ? '#FCD34D' : '#B45309';
            } else {
              displayType = 'Theory';
            }

            return (
              <Animated.View key={subject.id} entering={FadeInDown.delay(index * 50).duration(100)}>
                <Swipeable
                  renderRightActions={renderRightActions}
                  renderLeftActions={renderLeftActions}
                  friction={2}
                  rightThreshold={40}
                  leftThreshold={40}
                >
                  <Pressable 
                    style={[styles.subjectCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                    onPress={() => setSelectedActionSubject(subject)}
                  >
                    <View style={[styles.colorIndicator, { backgroundColor: subject.color }]} />
                    <View style={{ flex: 1, paddingVertical: 16, paddingRight: 12 }}>
                      <Text style={[textStyles.h3, { color: colors.textPrimary, marginBottom: 4 }]} numberOfLines={1}>
                        {subject.name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[textStyles.smallMedium, { color: colors.textSecondary }]}>{subject.code}</Text>
                        <View style={[styles.dot, { backgroundColor: colors.textQuaternary }]} />
                        <Text style={[textStyles.smallMedium, { color: colors.textSecondary }]}>{subject.credits} Credits</Text>
                      </View>
                    </View>
                    <View style={[styles.badge, { backgroundColor: bgColor }]}>
                      <Text style={[textStyles.small, { 
                        color: textColor,
                        fontSize: 10,
                        textTransform: 'uppercase'
                      }]}>
                        {displayType}
                      </Text>
                    </View>
                  </Pressable>
                </Swipeable>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
        <Pressable 
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(modals)/create-subject' as any)}
        >
          <Ionicons name="add" size={24} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={[textStyles.bodyMedium, { color: '#FFF' }]}>Add Subject</Text>
        </Pressable>
      </View>

      {/* Action Sheet Modal */}
      <Modal visible={!!selectedActionSubject} animationType="slide" transparent={true}>
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setSelectedActionSubject(null)}
        >
          <Pressable style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <View style={{ width: 40, height: 4, backgroundColor: colors.borderLight, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            
            <Text style={[textStyles.h3, { color: colors.textPrimary, marginBottom: 4, textAlign: 'center' }]}>
              {selectedActionSubject?.name}
            </Text>
            <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: 24, textAlign: 'center' }]}>
              Create a new class for this subject
            </Text>

            <Pressable 
              style={[styles.actionBtn, { backgroundColor: colors.bgSecondary }]}
              onPress={() => {
                router.push(`/(modals)/create-class?subjectId=${selectedActionSubject?.id}` as any);
                setSelectedActionSubject(null);
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>Add Class</Text>
                <Text style={[textStyles.small, { color: colors.textSecondary }]}>Schedule a regular theory class</Text>
              </View>
            </Pressable>

            {(selectedActionSubject?.type !== 'theory') && (
              <Pressable 
                style={[styles.actionBtn, { backgroundColor: colors.bgSecondary }]}
                onPress={() => {
                  router.push(`/(modals)/create-class?subjectId=${selectedActionSubject?.id}&isLab=true` as any);
                  setSelectedActionSubject(null);
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#7E22CE20' }]}>
                  <Ionicons name="beaker-outline" size={24} color="#7E22CE" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>Add Lab Class</Text>
                  <Text style={[textStyles.small, { color: colors.textSecondary }]}>Schedule a practical laboratory session</Text>
                </View>
              </Pressable>
            )}

            <Pressable 
              style={[styles.actionBtn, { backgroundColor: colors.bgSecondary }]}
              onPress={() => {
                router.push(`/(modals)/create-extra-class?subjectId=${selectedActionSubject?.id}` as any);
                setSelectedActionSubject(null);
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.warning + '20' }]}>
                <Ionicons name="add-circle-outline" size={24} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>Add Extra Class</Text>
                <Text style={[textStyles.small, { color: colors.textSecondary }]}>Schedule a one-off extra session</Text>
              </View>
            </Pressable>
            
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  colorIndicator: {
    width: 6,
    height: '100%',
    marginRight: 12,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    borderTopWidth: 1,
  },
  addBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  }
});
