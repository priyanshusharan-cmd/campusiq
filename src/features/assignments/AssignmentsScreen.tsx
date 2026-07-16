// Campora — Assignments Screen

import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Card, EmptyState, Badge } from '@/components/ui';
import { useAssignmentStore, useSubjectStore } from '@/stores';
import { formatDate, getDueUrgency } from '@/lib';

export default function AssignmentsScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();
  const assignments = useAssignmentStore((s) => s.assignments);
  const subjects = useSubjectStore((s) => s.subjects);
  const toggleComplete = useAssignmentStore((s) => s.toggleComplete);
  
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');

  const filteredAssignments = assignments.filter((a) => 
    filter === 'pending' ? a.status !== 'completed' : a.status === 'completed'
  ).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing['3xl'], paddingBottom: spacing.lg }}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} onPress={() => router.back()} style={{ marginRight: spacing.md }} />
        <Text style={[textStyles.h2, { color: colors.textPrimary }]}>Assignments</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
        <Pressable onPress={() => setFilter('pending')} style={{ flex: 1, paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: filter === 'pending' ? colors.primary : 'transparent', alignItems: 'center' }}>
          <Text style={[textStyles.bodyMedium, { color: filter === 'pending' ? colors.primary : colors.textSecondary }]}>Pending</Text>
        </Pressable>
        <Pressable onPress={() => setFilter('completed')} style={{ flex: 1, paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: filter === 'completed' ? colors.primary : 'transparent', alignItems: 'center' }}>
          <Text style={[textStyles.bodyMedium, { color: filter === 'completed' ? colors.primary : colors.textSecondary }]}>Completed</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100, gap: spacing.md }}>
        {filteredAssignments.length === 0 ? (
          <EmptyState icon="document-text-outline" title={filter === 'pending' ? 'All caught up!' : 'No completed assignments'} subtitle={filter === 'pending' ? 'You have no pending assignments.' : 'Complete some assignments to see them here.'} />
        ) : (
          filteredAssignments.map((assignment, index) => {
            const subject = subjects.find(s => s.id === assignment.subjectId);
            const isCompleted = assignment.status === 'completed';
            const urgency = getDueUrgency(assignment.dueDate);
            
            return (
              <Animated.View key={assignment.id} entering={FadeInDown.delay(index * 30).duration(80)}>
                <Card variant="flat" style={{ opacity: isCompleted ? 0.6 : 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable 
                      onPress={() => toggleComplete(assignment.id)}
                      style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: isCompleted ? colors.success : colors.border, backgroundColor: isCompleted ? colors.success : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}
                    >
                      {isCompleted && <Ionicons name="checkmark" size={16} color={colors.white} />}
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      <Text style={[textStyles.bodyMedium, { color: colors.textPrimary, textDecorationLine: isCompleted ? 'line-through' : 'none' }]}>{assignment.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 }}>
                        <Text style={[textStyles.small, { color: colors.textSecondary }]}>{subject?.shortName || 'Subject'}</Text>
                        <Text style={[textStyles.small, { color: colors.textQuaternary }]}>•</Text>
                        <Text style={[textStyles.small, { color: !isCompleted && urgency === 'danger' ? colors.danger : colors.textTertiary }]}>{formatDate(assignment.dueDate)}</Text>
                      </View>
                    </View>
                    {!isCompleted && (
                      <Badge label={assignment.priority.toUpperCase()} variant={assignment.priority === 'high' ? 'danger' : assignment.priority === 'medium' ? 'warning' : 'neutral'} size="sm" />
                    )}
                  </View>
                </Card>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
