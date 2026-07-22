import React, { useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, Platform, ScrollView, Modal, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { useSubjectStore, useSettingsStore, useActiveSubjects } from '@/stores';
import { GlassSlider, Card } from '@/components/ui';

export default function AttendanceGoalsScreen() {
  const { colors, spacing, textStyles, radius, isDark } = useTheme();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  
  // Calculate exact inner width of the modal card
  const modalInnerWidth = Math.min(windowWidth * 0.9, 400) - 48;
  
  // Stores
  const subjects = useActiveSubjects();
  const updateSubject = useSubjectStore(s => s.updateSubject);
  const globalTarget = useSettingsStore(s => s.attendanceTarget);
  const setGlobalTarget = useSettingsStore(s => s.setAttendanceTarget);

  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const selectedSubject = useMemo(() => subjects.find(s => s.id === selectedSubjectId), [subjects, selectedSubjectId]);
  
  const [localSubjectTarget, setLocalSubjectTarget] = useState<number>(75);

  const openSubjectSheet = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    const subject = subjects.find(s => s.id === subjectId);
    setLocalSubjectTarget(subject?.attendanceTarget || globalTarget);
    setIsModalVisible(true);
  };

  const handleSaveSubjectTarget = () => {
    if (selectedSubjectId) {
      updateSubject(selectedSubjectId, { attendanceTarget: localSubjectTarget });
    }
    setIsModalVisible(false);
  };

  const handleResetSubjectTarget = () => {
    if (selectedSubjectId) {
      updateSubject(selectedSubjectId, { attendanceTarget: undefined });
    }
    setIsModalVisible(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSecondary }} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.borderLight }]} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[textStyles.h2, { color: colors.textPrimary, flex: 1, textAlign: 'center' }]}>Attendance Goals</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(0).duration(100)}>
          <Card variant="elevated" padding={20} style={{ marginBottom: spacing.xl, borderRadius: radius.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={[styles.iconSquare, { backgroundColor: colors.primaryLight, marginRight: 12 }]}>
                <Ionicons name="flag" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Global Target</Text>
                <Text style={[textStyles.small, { color: colors.textSecondary }]}>Applies to all subjects by default</Text>
              </View>
            </View>
            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <GlassSlider 
                value={globalTarget} 
                min={50} 
                max={100} 
                onChange={(val) => setGlobalTarget(val)} 
              />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(50).duration(100)}>
          <Text style={[textStyles.h3, { color: colors.textPrimary, marginBottom: spacing.md, marginLeft: 4 }]}>
            Subject Specific Targets
          </Text>
          
          {subjects.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Ionicons name="book-outline" size={48} color={colors.textQuaternary} />
              <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 12 }]}>No subjects added yet</Text>
            </View>
          ) : (
            subjects.map((subject, index) => (
              <Animated.View key={subject.id} entering={FadeInDown.delay(index * 50 + 100).duration(100)}>
                <TouchableOpacity 
                  activeOpacity={0.7}
                  style={[styles.subjectRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                  onPress={() => openSubjectSheet(subject.id)}
                >
                  <View style={[styles.colorIndicator, { backgroundColor: subject.color }]} />
                  <View style={{ flex: 1, paddingVertical: 16, paddingRight: 12 }}>
                    <Text style={[textStyles.bodyMedium, { color: colors.textPrimary, marginBottom: 2 }]} numberOfLines={1}>
                      {subject.name}
                    </Text>
                    <Text style={[textStyles.small, { color: colors.textSecondary }]}>{subject.code}</Text>
                  </View>
                  <View style={[styles.targetBadge, { backgroundColor: subject.attendanceTarget ? (isDark ? 'rgba(124, 92, 252, 0.15)' : colors.primaryLight) : (isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6') }]}>
                    <Text style={[textStyles.smallMedium, { color: subject.attendanceTarget ? (isDark ? '#A78BFA' : colors.primary) : (isDark ? '#FFFFFF' : colors.textSecondary) }]}>
                      {subject.attendanceTarget ? `${subject.attendanceTarget}%` : `${globalTarget}%`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textQuaternary} style={{ marginLeft: 8, marginRight: 16 }} />
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </Animated.View>
      </ScrollView>

      {/* Standard Modal for Subject Target */}
      <Modal visible={isModalVisible} animationType="fade" transparent={true} onRequestClose={() => setIsModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            {selectedSubject && (
              <View style={{ width: '100%' }}>
                <Text style={[textStyles.h2, { color: colors.textPrimary, marginBottom: 8, textAlign: 'center' }]}>
                  {selectedSubject.name}
                </Text>
                <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: 24, textAlign: 'center' }]}>
                  Set custom attendance target
                </Text>

                <View style={{ alignItems: 'center', marginBottom: 40 }}>
                  <GlassSlider 
                    width={modalInnerWidth}
                    value={localSubjectTarget} 
                    min={50} 
                    max={100} 
                    onChange={(val) => setLocalSubjectTarget(val)} 
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable 
                    style={[styles.sheetBtn, { flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}
                    onPress={handleResetSubjectTarget}
                  >
                    <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>Use Default</Text>
                  </Pressable>
                  
                  <Pressable 
                    style={[styles.sheetBtn, { flex: 1, backgroundColor: colors.primary }]}
                    onPress={handleSaveSubjectTarget}
                  >
                    <Text style={[textStyles.bodyMedium, { color: '#FFF' }]}>Save Target</Text>
                  </Pressable>
                </View>
              </View>
            )}
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
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectRow: {
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
  targetBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sheetBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  }
});
