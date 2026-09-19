import React, { useCallback } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTheme } from '@/theme';
import TodayScreen from '@/features/today/TodayScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function SwipeBackWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const translateX = useSharedValue(0);

  // Reset translation whenever the screen comes into focus to prevent flashes
  useFocusEffect(
    useCallback(() => {
      translateX.value = 0;
    }, [])
  );

  const goBack = () => {
    router.navigate('/');
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      // Only allow dragging to the right (positive translationX)
      translateX.value = Math.max(0, e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX > SCREEN_WIDTH * 0.25 || e.velocityX > 500) {
        // Animate out completely, then navigate
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 250 }, (isFinished) => {
          if (isFinished) {
            runOnJS(goBack)();
            // We intentionally don't reset translateX here to prevent a visual flash.
            // It will be reset by useFocusEffect when the user comes back to this tab.
          }
        });
      } else {
        // Spring back if not swiped far enough
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    backgroundColor: 'transparent'
  }));

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#000' : '#E5E5EA' }}>
      <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
        <TodayScreen isBackground={true} />
      </View>
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
      
      {/* Invisible hitbox on the left edge to intercept edge swipes only */}
      <GestureDetector gesture={pan}>
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 35, backgroundColor: 'transparent' }} />
      </GestureDetector>
    </View>
  );
}
