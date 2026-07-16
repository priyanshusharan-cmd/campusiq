// Campora — Attendance Gauge Component
// Animated semi-circle gauge with needle showing attendance percentage

import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { styles } from '../styles/attendanceDetailStyles';

interface AttendanceGaugeProps {
  percentage: number;
  present: number;
  totalClasses: number;
  canMiss: number;
}

export function AttendanceGauge({ percentage, present, totalClasses, canMiss }: AttendanceGaugeProps) {
  const statusColor = percentage >= 75 ? '#10B981' : '#EF4444';

  const rotation = useSharedValue(-90);

  React.useEffect(() => {
    const targetAngle = -90 + (percentage * 1.8);
    rotation.value = withDelay(300, withTiming(targetAngle, { duration: 1200, easing: Easing.out(Easing.cubic) }));
  }, [percentage]);

  const needleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: 18 },
        { rotate: `${rotation.value}deg` },
        { translateY: -18 }
      ]
    };
  });

  const fillAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value - 135}deg` }
      ]
    };
  });

  return (
    <View>
      <LinearGradient
        colors={['#4338CA', '#312E81']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statsCard}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 }}>Overall Attendance</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 }}>
              <Text style={{ color: '#fff', fontSize: 36, fontWeight: '700', lineHeight: 40 }}>{percentage}%</Text>
              <View style={[styles.badge, { backgroundColor: `${statusColor}20`, marginBottom: 8, marginLeft: 12 }]}>
                <Text style={{ color: statusColor, fontSize: 11, fontWeight: '600' }}>{percentage >= 75 ? 'Good' : 'Low'}</Text>
              </View>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 12 }}>{present} / {totalClasses} classes</Text>
            
            {/* Progress Bar */}
            <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, width: '100%', marginBottom: 16 }}>
              <View style={{ height: '100%', backgroundColor: statusColor, borderRadius: 2, width: `${percentage}%` }} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.6)" style={{ marginRight: 6 }} />
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Last updated: Just now</Text>
            </View>
          </View>

          {/* Gauge Indicator */}
          <View style={{ width: 120, alignItems: 'center', justifyContent: 'center' }}>
            <View style={styles.gaugeWrapper}>
              <View style={styles.gaugeContainer}>
                {/* Gauge Background */}
                <View style={styles.gaugeArcBg} />
                {/* Gauge Fill */}
                <Animated.View style={[styles.gaugeArcFill, { borderColor: statusColor }, fillAnimatedStyle]} />
              </View>
              {/* Needle */}
              <Animated.View style={[styles.gaugeNeedle, needleAnimatedStyle]} />
              {/* Needle Base Circle */}
              <View style={styles.needleBase} />
            </View>
            {canMiss >= 0 ? (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, marginTop: 8 }}>You can miss</Text>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{canMiss} more classes</Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>to maintain 75%</Text>
              </>
            ) : (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, marginTop: 8 }}>You need</Text>
                <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '700' }}>{-canMiss} more classes</Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>to reach 75%</Text>
              </>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
