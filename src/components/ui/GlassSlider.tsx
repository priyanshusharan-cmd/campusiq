import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS 
} from 'react-native-reanimated';
import { useTheme } from '@/theme';

interface GlassSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  width?: number;
}

export function GlassSlider({ value, min, max, onChange, width = Dimensions.get('window').width - 48 }: GlassSliderProps) {
  const { colors, textStyles } = useTheme();
  const TRACK_HEIGHT = 48;
  const KNOB_WIDTH = 56;
  const MAX_TRANSLATE = width - KNOB_WIDTH - 8; // 8 for padding (4 on each side)

  const getInitialPosition = () => {
    const percentage = (value - min) / (max - min);
    return Math.max(0, Math.min(percentage * MAX_TRANSLATE, MAX_TRANSLATE));
  };

  const translateX = useSharedValue(getInitialPosition());
  const contextX = useSharedValue(0);
  
  // Local state just for displaying the number smoothly while dragging
  const [displayValue, setDisplayValue] = useState(value);

  // Sync value if it changes externally
  useEffect(() => {
    translateX.value = withSpring(getInitialPosition(), { damping: 20, stiffness: 200 });
    setDisplayValue(value);
  }, [value, min, max, MAX_TRANSLATE]);

  const handleUpdate = (position: number) => {
    const percentage = position / MAX_TRANSLATE;
    const rawVal = min + percentage * (max - min);
    const rounded = Math.round(rawVal);
    setDisplayValue(rounded);
  };

  const handleChangeEnd = (position: number) => {
    const percentage = position / MAX_TRANSLATE;
    const rawVal = min + percentage * (max - min);
    const rounded = Math.round(rawVal);
    onChange(rounded);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((event) => {
      let newTranslation = contextX.value + event.translationX;
      newTranslation = Math.max(0, Math.min(newTranslation, MAX_TRANSLATE));
      translateX.value = newTranslation;
      runOnJS(handleUpdate)(newTranslation);
    })
    .onEnd(() => {
      runOnJS(handleChangeEnd)(translateX.value);
    });

  const animatedKnobStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const animatedFillStyle = useAnimatedStyle(() => {
    return {
      width: translateX.value + KNOB_WIDTH / 2,
    };
  });

  return (
    <View style={[styles.container, { width, height: TRACK_HEIGHT, backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <Animated.View style={[styles.fill, { backgroundColor: colors.primaryLight }, animatedFillStyle]} />
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.knob, { backgroundColor: colors.primary, shadowColor: colors.primary }, animatedKnobStyle]}>
          <Text style={[textStyles.smallMedium, { color: '#FFF' }]}>{displayValue}%</Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    padding: 4,
  },
  fill: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 20,
  },
  knob: {
    width: 56,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  }
});
