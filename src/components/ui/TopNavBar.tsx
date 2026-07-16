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
}

export function TopNavBar({ firstName }: TopNavBarProps) {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.xl, paddingVertical: spacing.md }]}>
      {/* Placeholder to maintain flex balance for centered logo */}
      <View style={styles.iconBtn} />

      {/* Campora Logo */}
      <View style={styles.logoContainer}>
        {/* Simulating the logo with a graduation cap over the C */}
        <View style={styles.logoIconContainer}>
          <View style={{
            position: 'absolute',
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: '#E0E7FF', // subtle blue blob from image
            left: -2,
            top: 6,
            zIndex: -1
          }} />
          <Ionicons name="school" size={16} color={colors.primary} style={styles.logoHat} />
          <Text style={[styles.logoText, { color: colors.primary, fontSize: 32 }]}>C</Text>
        </View>
        <Text style={[styles.logoText, { color: colors.primary, marginLeft: -2 }]}>ampora</Text>
      </View>

      <View style={styles.rightSection}>
        <Pressable style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          <View style={[styles.badge, { backgroundColor: colors.danger }]} />
        </Pressable>

        <Pressable style={[styles.avatarWrap, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primaryLight }]} onPress={() => router.push('/profile' as any)}>
          <Ionicons name="person" size={20} color={colors.primary} />
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
