import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/navigation/CustomTabBar';
import FloatingAIButton from '@/features/ai/components/FloatingAIButton';

export default function TabsLayout() {
  return (
    <View style={styles.container}>
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
      <FloatingAIButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
