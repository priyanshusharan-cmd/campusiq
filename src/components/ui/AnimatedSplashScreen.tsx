import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { useTheme } from '@/theme';

// Prevent the native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');

interface Props {
  onAnimationComplete: () => void;
}

export default function AnimatedSplashScreen({ onAnimationComplete }: Props) {
  const { colors } = useTheme();
  const [isAppReady, setIsAppReady] = useState(false);

  // Reanimated Shared Values
  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Hide the native splash immediately, revealing our animated overlay
    SplashScreen.hideAsync()
      .then(() => {
        setIsAppReady(true);
      })
      .catch(() => {
        setIsAppReady(true);
      });
  }, []);

  useEffect(() => {
    if (isAppReady) {
      // 1. Entrance: Bouncy scale-up and fade-in
      logoOpacity.value = withTiming(1, { duration: 600 });
      logoScale.value = withSpring(1, { damping: 15, stiffness: 90 });

      // 2. The Glow: Infinite neon pulse (lightbulb turning on)
      glowOpacity.value = withDelay(
        300,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 800 }),
            withTiming(0.4, { duration: 800 })
          ),
          -1,
          true
        )
      );

      // 3. Exit: Trigger after 1.0 second
      setTimeout(() => {
        // Fade out the entire container
        containerOpacity.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(onAnimationComplete)();
        });
        // Slight cinematic zoom-in while fading out
        logoScale.value = withTiming(1.3, { duration: 300 });
      }, 1000);
    }
  }, [isAppReady]);

  // Animated Styles
  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value, // Match entrance fade
    transform: [{ scale: logoScale.value }],
    shadowOpacity: glowOpacity.value, // Pulse the huge ambient shadow
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  if (!isAppReady) return null;

  return (
    <Modal visible transparent animationType="none">
      <Animated.View style={[styles.container, animatedContainerStyle, { backgroundColor: colors.bg }]}>
        {/* Ambient Glow layer (same shape as logo, casts massive shadow) */}
        <Animated.Image
          source={require('@/assets/images/campusiq-icon-transparent.png')}
          style={[styles.ambientGlow, animatedGlowStyle]}
          resizeMode="contain"
        />
        
        {/* The Transparent Logo */}
        <Animated.Image
          source={require('@/assets/images/campusiq-icon-transparent.png')}
          style={[styles.logo, animatedLogoStyle]}
          resizeMode="contain"
        />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
    zIndex: 2,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    shadowOpacity: 0.8,
  },
  ambientGlow: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    zIndex: 1,
    shadowColor: '#a78bfa', // Brighter, softer purple
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 50, // Massive blur
    elevation: 20,
  },
});
