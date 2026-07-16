import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { useSubjectStore } from '@/stores';

export default function SubjectsListScreen() {
  const { colors, spacing, textStyles, radius } = useTheme();
  const router = useRouter();
  const subjects = useSubjectStore(s => s.subjects);
  const removeSubject = useSubjectStore(s => s.removeSubject);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Subject',
      `Are you sure you want to delete \${name}? This will also delete related attendance and timetable records.`,
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSecondary }} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[textStyles.h2, { color: colors.textPrimary, flex: 1, textAlign: 'center' }]}>Subjects</Text>
        <View style={{ width: 40 }} />
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
          subjects.map((subject, index) => (
            <Animated.View key={subject.id} entering={FadeInDown.delay(index * 50).duration(100)}>
              <Pressable 
                style={[styles.subjectCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                onPress={() => router.push(`/(modals)/create-subject?id=\${subject.id}` as any)}
                onLongPress={() => handleDelete(subject.id, subject.name)}
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
                <View style={[styles.badge, { backgroundColor: subject.type === 'theory' ? '#E0E7FF' : subject.type === 'lab' ? '#DCFCE7' : '#FEF3C7' }]}>
                  <Text style={[textStyles.small, { 
                    color: subject.type === 'theory' ? '#4338CA' : subject.type === 'lab' ? '#15803D' : '#B45309',
                    fontSize: 10,
                    textTransform: 'capitalize'
                  }]}>
                    {subject.type}
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          ))
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
    backgroundColor: '#F3F4F6',
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
  }
});
