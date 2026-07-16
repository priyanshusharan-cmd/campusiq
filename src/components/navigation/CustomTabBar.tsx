// Campora — Custom Tab Bar with center FAB

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, interpolateColor } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TabItemProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  onPress: () => void;
}

function TabItem({ label, icon, activeIcon, isActive, onPress }: TabItemProps) {
  const { colors, spacing } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={styles.tabItem}
    >
      <Ionicons
        name={isActive ? activeIcon : icon}
        size={22}
        color={isActive ? colors.primary : colors.textTertiary}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: isActive ? colors.primary : colors.textTertiary, fontWeight: isActive ? '600' : '400' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, shadows, radius, spacing } = useTheme();
  const router = useRouter();

  const tabs: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'index', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { key: 'schedule', label: 'Timetable', icon: 'calendar-outline', activeIcon: 'calendar' },
    { key: 'fab', label: '', icon: 'add', activeIcon: 'add' },
    { key: 'attendance', label: 'Attendance', icon: 'checkmark-circle-outline', activeIcon: 'checkmark-circle' },
    { key: 'more', label: 'More', icon: 'grid-outline', activeIcon: 'grid' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.tabBar, borderTopColor: colors.tabBarBorder }]}>
      {tabs.map((tab, index) => {
        if (tab.key === 'fab') {
          return (
            <View key="fab" style={styles.fabContainer}>
              <Pressable
                onPress={() => {
                  router.push('/(modals)/create' as any);
                }}
                style={[
                  styles.fab,
                  { backgroundColor: colors.primary },
                  shadows.lg,
                ]}
              >
                <Ionicons name="add" size={28} color="#FFFFFF" />
              </Pressable>
            </View>
          );
        }

        // Map tab key to actual route index (skip fab)
        const routeIndex = index > 2 ? index - 1 : index;
        const isActive = state.index === routeIndex;

        return (
          <TabItem
            key={tab.key}
            label={tab.label}
            icon={tab.icon}
            activeIcon={tab.activeIcon}
            isActive={isActive}
            onPress={() => {
              const route = state.routes[routeIndex];
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isActive && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
