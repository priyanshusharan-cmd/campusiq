// Campora — Entry Point Redirect

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSettingsStore } from '@/stores';
import { useTheme } from '@/theme';
import { View } from 'react-native';

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsReady(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        // Wait for Zustand hydration to complete before redirecting
        const checkHydration = () => {
          if (useSettingsStore.persist.hasHydrated()) {
            const currentOnboarded = useSettingsStore.getState().onboardingCompleted;
            if (currentOnboarded) {
              router.replace('/(tabs)');
            } else {
              router.replace('/(onboarding)/welcome');
            }
          } else {
            setTimeout(checkHydration, 50);
          }
        };
        checkHydration();
      }
    }, [isReady, router])
  );

  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} />
  );
}
