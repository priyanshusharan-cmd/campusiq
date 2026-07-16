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
    let isMounted = true;
    
    let settingsHydrated = useSettingsStore.persist.hasHydrated();
    let profileHydrated = useProfileStore.persist.hasHydrated();
    let subjectHydrated = useSubjectStore.persist.hasHydrated();

    const checkHydration = () => {
      if (settingsHydrated && profileHydrated && subjectHydrated && isMounted) {
        setIsReady(true);
      }
    };

    const unsubSettings = useSettingsStore.persist.onFinishHydration(() => {
      settingsHydrated = true;
      checkHydration();
    });
    
    const unsubProfile = useProfileStore.persist.onFinishHydration(() => {
      profileHydrated = true;
      checkHydration();
    });
    
    const unsubSubject = useSubjectStore.persist.onFinishHydration(() => {
      subjectHydrated = true;
      checkHydration();
    });

    checkHydration();

    return () => {
      isMounted = false;
      if (unsubSettings) unsubSettings();
      if (unsubProfile) unsubProfile();
      if (unsubSubject) unsubSubject();
    };
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
