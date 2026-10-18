import { useMemo } from 'react';
import { useRouter as useExpoRouter } from 'expo-router';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function useRouter(): ReturnType<typeof useExpoRouter> {
  const router = useExpoRouter();
  return useMemo(() => ({
    ...router,
    back() {
      if (router.canGoBack()) router.back();
      else router.replace(useSettingsStore.getState().onboardingCompleted ? '/(tabs)' : '/');
    },
  }), [router]);
}
