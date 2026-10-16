import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useSettingsStore } from '@/stores';
import { loadDemoData } from '@/platform/demoData.web';

// Use the mobile app's existing onboarding and Home screens. The optional
// ?demo=1 link opens sample data directly without adding a separate web design.
export default function WebEntry() {
  const onboarded = useSettingsStore(s => s.onboardingCompleted);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('demo') === '1') loadDemoData();
    setReady(true);
  }, []);
  if (!ready) return null;
  return <Redirect href={onboarded ? '/(tabs)' : '/(onboarding)/welcome'} />;
}
