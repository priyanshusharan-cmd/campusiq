// Campora — Card Component

import React from 'react';
import { View, StyleSheet, Pressable, type ViewStyle, type StyleProp } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'elevated' | 'flat' | 'outlined';
  padding?: number;
}

export function Card({ children, style, onPress, variant = 'elevated', padding }: CardProps) {
  const { colors, spacing, radius, shadows } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    // eslint-disable-next-line
    if (onPress) scale.value = withSpring(0.97, { damping: 12, stiffness: 400 });
  };

  const handlePressOut = () => {
    // eslint-disable-next-line
    scale.value = withSpring(1, { damping: 12, stiffness: 400 });
  };

  const cardStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: padding ?? spacing.lg,
    ...(variant === 'elevated' ? shadows.sm : {}),
    ...(variant === 'outlined' ? { borderWidth: 1, borderColor: colors.border } : {}),
  };

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle, cardStyle, style]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}
