import React from 'react';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
export default function FloatingAIButton() {
  const router = useRouter();
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel="Open demo assistant" onPress={() => router.push('/campus-ai')}
    style={{ position: 'absolute', right: 18, bottom: 94, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 18, boxShadow: '0 4px 20px #42307733' }}>
    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>✦ Ask CampusIQ</Text>
  </Pressable>;
}
