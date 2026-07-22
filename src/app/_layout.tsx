// Campora — Root Layout

import React, { useEffect } from 'react';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack , usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider, useTheme } from '@/theme';
import { Drawer } from 'react-native-drawer-layout';
import { useDrawerStore, useSettingsStore } from '@/stores';
import MoreScreen from '@/features/more/MoreScreen';
import * as LocalAuthentication from 'expo-local-authentication';
import { AppState, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [storesHydrated, setStoresHydrated] = React.useState(false);

  useEffect(() => {
    let isMounted = true;
    const { useSettingsStore, useProfileStore, useSubjectStore, useAttendanceStore, useTimetableStore, useAssignmentStore, useExamStore, useAcademicStore } = require('@/stores');

    const stores = [
      useSettingsStore,
      useProfileStore,
      useSubjectStore,
      useAttendanceStore,
      useTimetableStore,
      useAssignmentStore,
      useExamStore,
      useAcademicStore
    ];

    let hydratedStates = stores.map(store => store.persist.hasHydrated());

    const checkHydration = () => {
      if (hydratedStates.every(Boolean) && isMounted) {
        setStoresHydrated(true);
      }
    };

    const unsubs = stores.map((store, index) => 
      store.persist.onFinishHydration(() => {
        hydratedStates[index] = true;
        checkHydration();
      })
    );

    checkHydration();

    return () => {
      isMounted = false;
      unsubs.forEach(unsub => {
        if (unsub) unsub();
      });
    };
  }, []);

  useEffect(() => {
    if ((loaded || error) && storesHydrated) {
      SplashScreen.hideAsync();
      const { setupNotificationListeners } = require('@/utils/notificationListeners');
      setupNotificationListeners();
    }
  }, [loaded, error, storesHydrated]);

  if (!loaded && !error) {
    return null;
  }

  if (!storesHydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <BottomSheetModalProvider>
          <RootLayoutNav />
        </BottomSheetModalProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}


function AppLockWrapper({ children }: { children: React.ReactNode }) {
  const { colors, textStyles, spacing, radius } = useTheme();
  const appLockEnabled = useSettingsStore((s) => s.appLockEnabled);
  const [isUnlocked, setIsUnlocked] = React.useState(!appLockEnabled);

  const authenticate = React.useCallback(async () => {
    if (!appLockEnabled) return;
    
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (!hasHardware || !isEnrolled) {
      setIsUnlocked(true);
      return;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock CampusIQ',
        fallbackLabel: 'Use Passcode',
      });
      
      if (result.success) {
        setIsUnlocked(true);
      }
    } catch (e) {
      console.warn('Auth error', e);
    }
  }, [appLockEnabled]);

  React.useEffect(() => {
    if (appLockEnabled) {
      setIsUnlocked(false);
      authenticate();
    } else {
      setIsUnlocked(true);
    }
  }, [appLockEnabled, authenticate]);

  React.useEffect(() => {
    let appState = AppState.currentState;
    
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        // Only lock when fully in background. 'inactive' is triggered by the FaceID prompt itself!
        if (appLockEnabled) {
          setIsUnlocked(false);
        }
      } else if (nextAppState === 'active' && appState.match(/inactive|background/)) {
        if (appLockEnabled && !isUnlocked) {
          authenticate();
        }
      }
      appState = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [appLockEnabled, isUnlocked, authenticate]);

  if (!isUnlocked) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
        <StatusBar style={useTheme().isDark ? 'light' : 'dark'} />
        <View style={{ width: 120, height: 120, borderRadius: 36, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl, overflow: 'hidden' }}>
          <Image source={require('@/assets/images/campusiq-icon.png')} style={{ width: '104%', height: '104%' }} resizeMode="cover" />
        </View>
        <Text style={[textStyles.h2, { color: colors.textPrimary, marginBottom: spacing.sm }]}>CampusIQ is Locked</Text>
        <Text style={[textStyles.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing['3xl'] }]}>
          Please authenticate to view your academic data.
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.full }}
          onPress={authenticate}
        >
          <Text style={[textStyles.bodySemiBold, { color: colors.white }]}>Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  const { isDark } = useTheme();
  const pathname = usePathname();
  const { isOpen, setDrawerOpen } = useDrawerStore();
  
  // Only allow swipe to open on the home screen '/'
  const isHome = pathname === '/' || pathname === '';

  return (
    <AppLockWrapper>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Drawer
        open={isOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
        swipeEdgeWidth={isHome ? 100 : 0}
        renderDrawerContent={() => <MoreScreen />}
      >
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: true, fullScreenGestureEnabled: true }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen name="(onboarding)" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="(modals)" options={{ headerShown: false, animation: 'default' }} />
          {/* Additional stacks for sub-pages like academics, assignments, exams, etc. */}
          <Stack.Screen name="academics" />
          <Stack.Screen name="assignments" />
          <Stack.Screen name="exams" />
          <Stack.Screen name="analytics" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="settings" />
        </Stack>
      </Drawer>
    </AppLockWrapper>
  );
}
