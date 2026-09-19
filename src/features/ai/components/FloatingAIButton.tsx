import React, { useRef } from 'react';
import { StyleSheet, Dimensions, Platform, Animated, PanResponder, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';

const { width, height } = Dimensions.get('window');
const BUTTON_SIZE = 60;
const INITIAL_BOTTOM = Platform.OS === 'ios' ? 100 : 90;
const INITIAL_RIGHT = 20;

const BOUNDS = {
  left: 10,
  right: width - BUTTON_SIZE - 10,
  top: 50,
  bottom: height - BUTTON_SIZE - INITIAL_BOTTOM - 20, 
};

export default function FloatingAIButton() {
  const router = useRouter();
  const theme = useTheme();
  
  // Hide the button if Cloud AI is disabled
  const cloudAiEnabled = useSettingsStore(s => s.cloudAiEnabled);
  const pan = useRef(
    new Animated.ValueXY({
      x: width - BUTTON_SIZE - INITIAL_RIGHT,
      y: height - BUTTON_SIZE - INITIAL_BOTTOM,
    })
  ).current;
  
  const scale = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
        
        Animated.spring(scale, {
          toValue: 0.9,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: false,
        }).start();

        // Snap to edges
        let destX = (pan.x as any)._value;
        if (destX < width / 2 - BUTTON_SIZE / 2) {
          destX = BOUNDS.left;
        } else {
          destX = BOUNDS.right;
        }
        
        const destY = Math.max(BOUNDS.top, Math.min((pan.y as any)._value, BOUNDS.bottom));

        Animated.spring(pan, {
          toValue: { x: destX, y: destY },
          useNativeDriver: false,
          friction: 7,
          tension: 40,
        }).start();

        // If not dragged much, consider it a tap
        if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
          router.push('/(modals)/campus-ai');
        }
      },
    })
  ).current;

  if (!cloudAiEnabled) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scale }
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.primary,
          },
        ]}
      >
        <Ionicons name="sparkles" size={28} color={theme.colors.white} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
});
