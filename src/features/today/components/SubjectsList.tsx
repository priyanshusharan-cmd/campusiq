// Campora — SubjectsList Component
// Vertically stacked list of all subjects

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { useActiveSubjects, useTimetableStore } from '@/stores';
import { Card } from '@/components/ui/Card';
import { getSubjectTheme } from '@/utils/subjectTheme';

export function SubjectsList() {
  const { colors, spacing, textStyles, isDark } = useTheme();
  const subjects = useActiveSubjects();
  const timetableEntries = useTimetableStore(s => s.entries);
  const router = useRouter();

  if (subjects.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(40).duration(100)} style={{ marginBottom: spacing.xl }}>
      <View style={styles.header}>
        <Text style={[textStyles.h3, { color: isDark ? '#FFFFFF' : colors.textPrimary, fontSize: 18 }]}>All Subjects</Text>
      </View>

      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
        {subjects.map((subject, index) => {
          const subjectEntries = timetableEntries.filter(e => e.subjectId === subject.id);
          const hasLab = subjectEntries.some(e => e.type === 'lab');
          const hasTheory = subjectEntries.some(e => e.type === 'lecture');
          
          let typeText = subject.type ? subject.type : 'Subject';
          if (hasLab) typeText = 'Theory & Lab';
          else if (hasTheory) typeText = 'Theory';
          
          const theme = getSubjectTheme(subject.name, subject.code, isDark, subject.color, subject.icon);
          const icon = theme.icon;
          
          return (
            <Pressable 
              key={subject.id} 
              onPress={() => router.push(`/attendance/${subject.id}?tab=overview`)}
              style={({ pressed }) => [
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
              ]}
            >
              <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight, { borderLeftWidth: 4, borderLeftColor: theme.color, padding: spacing.md }]}>
                
                <View style={styles.cardContent}>
                  {/* Left Icon */}
                  <View style={[styles.iconSquare, { backgroundColor: theme.bgColor }]}>
                    <Ionicons name={icon} size={20} color={theme.color} />
                  </View>
                  
                  {/* Middle Info */}
                  <View style={styles.infoColumn}>
                    <Text style={[textStyles.bodySemiBold, { color: isDark ? '#FFFFFF' : colors.textPrimary }]} numberOfLines={1}>
                      {subject.name}
                    </Text>
                    {!!subject.faculty && (
                      <Text style={[textStyles.small, { color: isDark ? 'rgba(255,255,255,0.6)' : colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
                        {subject.faculty}
                      </Text>
                    )}
                  </View>
                  
                  {/* Right Tag */}
                  <View style={[styles.tag, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.surface }]}>
                    <Ionicons name="bookmark-outline" size={10} color={isDark ? "rgba(255,255,255,0.6)" : colors.textSecondary} style={{ marginRight: 2 }} />
                    <Text style={[textStyles.caption, { color: isDark ? 'rgba(255,255,255,0.6)' : colors.textSecondary, textTransform: 'uppercase' }]}>{typeText}</Text>
                  </View>
                </View>
                
              </View>
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
  cardDark: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
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
