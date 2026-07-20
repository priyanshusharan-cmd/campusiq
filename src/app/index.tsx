// Campora — Entry Point Redirect

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSettingsStore, useProfileStore, useSubjectStore } from '@/stores';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const onboarded = useSettingsStore((s) => s.onboardingCompleted);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsReady(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        // Fetch the latest state directly from the store to avoid hydration race conditions
        const currentOnboarded = useSettingsStore.getState().onboardingCompleted;

        if (currentOnboarded) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(onboarding)/welcome');
        }
      }
    }, [isReady])
  );

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#7C5CFC" />
    </View>
  );
}
