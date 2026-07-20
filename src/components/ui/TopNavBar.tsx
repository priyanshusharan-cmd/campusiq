// Campora — TopNavBar Component
// Shared navigation bar with logo and user profile

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useRouter } from 'expo-router';

interface TopNavBarProps {
  firstName: string;
  avatarUri?: string;
}

export function TopNavBar({ firstName, avatarUri }: TopNavBarProps) {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.xl, paddingVertical: spacing.md }]}>
      {/* Placeholder to maintain flex balance for centered logo */}
      <View style={styles.iconBtn} />

      {/* Native Designer Logo */}
      <View style={styles.logoContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 6,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          }}>
            <Ionicons name="school" size={18} color="#fff" style={{ marginLeft: 2 }} />
          </View>
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 22, color: colors.textPrimary, letterSpacing: -0.5 }}>
            Campus<Text style={{ color: colors.primary }}>IQ</Text>
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>


        <Pressable style={[styles.avatarWrap, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primaryLight, overflow: 'hidden' }]} onPress={() => router.push('/profile' as any)}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={{ width: 36, height: 36, borderRadius: 18 }} />
          ) : (
            <Ionicons name="person" size={20} color={colors.primary} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    flex: 1,
    paddingBottom: 4,
  },
  logoIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoHat: {
    position: 'absolute',
    top: -6,
    left: 2,
    transform: [{ rotate: '-15deg' }],
    zIndex: 2,
  },
  logoText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    letterSpacing: -0.5,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatar: {
    width: '100%',
    height: '100%',
  }
});
