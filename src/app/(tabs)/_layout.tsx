// Campora — Tabs Layout

import React from 'react';
import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/navigation/CustomTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...(props as any)} />}
      screenOptions={{
        headerShown: false,
        lazy: true, // Optimizes memory by only rendering active tabs
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="attendance" />
      <Tabs.Screen name="gpa" />
    </Tabs>
  );
}
