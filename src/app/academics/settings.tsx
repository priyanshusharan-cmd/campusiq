import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useSettingsStore } from '@/stores';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '@/components/ui';
import { TextInput } from '@/components/form';

export default function AcademicSettingsScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();
  
  const { passingMarks, setPassingMarks } = useSettingsStore();

  const handleMarksChange = (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setPassingMarks(num);
    } else if (val === '') {
      setPassingMarks(0);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bg }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Academic Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInDown.delay(100).duration(200)}>
          <Card variant="elevated" padding={spacing.lg} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Passing Criteria</Text>
                <Text style={[textStyles.small, { color: colors.textSecondary }]}>Minimum marks to pass a subject</Text>
              </View>
            </View>
            
            <View style={{ marginTop: 20 }}>
              <TextInput 
                label="Passing Marks"
                placeholder="40"
                keyboardType="numeric"
                value={passingMarks > 0 ? passingMarks.toString() : ''}
                onChangeText={handleMarksChange}
              />
              <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: -8 }]}>
                Subjects scoring below this will be marked as a Backlog.
              </Text>
            </View>
          </Card>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 24,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
