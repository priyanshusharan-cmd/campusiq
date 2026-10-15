import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from '@/platform/router';
import { useTheme } from '@/theme';
export default function WebDemoAccess() {
  const { colors } = useTheme();
  const router = useRouter();
  return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 28, gap: 20 }}>
    <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary }}>Explore the demo assistant</Text>
    <Text style={{ fontSize: 16, lineHeight: 25, color: colors.textSecondary }}>Ask about your attendance, timetable, and grades. This browser demo uses local calculations and requires no subscription. Cloud AI and app-store purchases are not included.</Text>
    <Pressable accessibilityRole="button" onPress={() => router.replace('/campus-ai')} style={{ backgroundColor: colors.primary, padding: 18, borderRadius: 14 }}><Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Try the assistant</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ padding: 16 }}><Text style={{ color: colors.primary, textAlign: 'center' }}>Go back</Text></Pressable>
  </View>;
}
