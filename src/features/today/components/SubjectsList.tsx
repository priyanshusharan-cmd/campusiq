// Campora — SubjectsList Component
// Vertically stacked list of all subjects

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { useSubjectStore, useTimetableStore } from '@/stores';
import { Card } from '@/components/ui/Card';
import { getSubjectTheme } from '@/utils/subjectTheme';

export function SubjectsList() {
  const { colors, spacing, textStyles, isDark } = useTheme();
  const subjects = useSubjectStore(s => s.subjects);
  const timetableEntries = useTimetableStore(s => s.entries);
  const router = useRouter();

  if (subjects.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(40).duration(100)} style={{ marginBottom: spacing.xl }}>
      <View style={styles.header}>
        <Text style={[textStyles.h3, { color: colors.textPrimary, fontSize: 18 }]}>All Subjects</Text>
      </View>

      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
        {subjects.map((subject, index) => {
          const subjectEntries = timetableEntries.filter(e => e.subjectId === subject.id);
          const hasLab = subjectEntries.some(e => e.type === 'lab');
          const hasTheory = subjectEntries.some(e => e.type === 'lecture');
          
          let typeText = subject.type ? subject.type : 'Subject';
          if (hasLab) typeText = 'Theory & Lab';
          else if (hasTheory) typeText = 'Theory';
          
          const theme = getSubjectTheme(subject.name, subject.code, isDark);
          const icon = subject.icon || theme.icon;
          
          return (
            <Pressable 
              key={subject.id} 
              onPress={() => router.push(`/attendance/${subject.id}?tab=overview`)}
              style={({ pressed }) => [
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
              ]}
            >
              <Card variant="elevated" padding={spacing.md} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: theme.color }]}>
                
                <View style={styles.cardContent}>
                  {/* Left Icon */}
                  <View style={[styles.iconSquare, { backgroundColor: theme.bgColor }]}>
                    <Ionicons name={icon} size={20} color={theme.color} />
                  </View>
                  
                  {/* Middle Info */}
                  <View style={styles.infoColumn}>
                    <Text style={[textStyles.bodySemiBold, { color: colors.textPrimary }]} numberOfLines={1}>
                      {subject.name}
                    </Text>
                    {!!subject.faculty && (
                      <Text style={[textStyles.small, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
                        {subject.faculty}
                      </Text>
                    )}
                  </View>
                  
                  {/* Right Tag */}
                  <View style={[styles.tag, { backgroundColor: colors.surface }]}>
                    <Ionicons name="bookmark-outline" size={10} color={colors.textSecondary} style={{ marginRight: 2 }} />
                    <Text style={[textStyles.caption, { color: colors.textSecondary, textTransform: 'uppercase' }]}>{typeText}</Text>
                  </View>
                </View>
                
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoColumn: {
    flex: 1,
    marginRight: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  }
});
