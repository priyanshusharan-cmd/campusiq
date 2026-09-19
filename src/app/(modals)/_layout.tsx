// Campora — Modals Layout

import React from 'react';
import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'default', gestureEnabled: true, fullScreenGestureEnabled: true }}>
      <Stack.Screen name="create" />
      <Stack.Screen name="more" options={{ presentation: 'transparentModal', animation: 'slide_from_left' }} />
    </Stack>
  );
}
