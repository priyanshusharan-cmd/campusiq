// Campora — Attendance Gauge Component
// Animated semi-circle gauge with needle showing attendance percentage

import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { styles } from '../styles/attendanceDetailStyles';

interface AttendanceGaugeProps {
  title?: string;
  percentage: number;
  present: number;
  totalClasses: number;
  canMiss: number;
  needToAttend?: number;
  target?: number; // Added target prop
}

export function AttendanceGauge({ title = 'Overall Attendance', percentage, present, totalClasses, canMiss, needToAttend, target = 75 }: AttendanceGaugeProps) {
  const { isDark } = useTheme();

  const getStatus = (perc: number) => {
    if (perc >= target + 10) return { label: 'Excellent', color: '#10B981' };
    if (perc >= target + 5) return { label: 'Good', color: '#10B981' };
    if (perc > target) return { label: 'Above Target', color: '#10B981' };
    if (perc === target) return { label: 'On Track', color: '#10B981' };
    if (perc >= target - 5) return { label: 'At Risk', color: '#F59E0B' };
    return { label: 'Critical', color: '#EF4444' };
  };

  const status = getStatus(percentage);
  const statusColor = status.color;
  
  const unit = title.toLowerCase().includes('lab') ? 'lab' : 'class';
  const unitPlural = unit === 'class' ? 'classes' : unit + 's';
  const totalUnitLabel = totalClasses === 1 ? unit : unitPlural;

  let classesNeeded = needToAttend;
  if (classesNeeded === undefined) {
    classesNeeded = 0;
    if (percentage < target && target < 100) {
       classesNeeded = Math.ceil((target * totalClasses - 100 * present) / (100 - target));
       if (classesNeeded < 1) classesNeeded = 1; // Safeguard
    }
  }

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
        colors={isDark ? ['#302796', '#211F61'] : ['#4338CA', '#312E81']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statsCard}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginRight: 8 }}>{title}</Text>
              <View style={[styles.badge, { backgroundColor: `${statusColor}30` }]}>
                <Text style={{ color: statusColor, fontSize: 10, fontWeight: '600' }}>{status.label}</Text>
              </View>
            </View>
            <Text style={{ color: '#fff', fontSize: 36, fontWeight: '700', lineHeight: 40, marginBottom: 8 }}>{percentage}%</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 12 }}>{present} / {totalClasses} {totalUnitLabel}</Text>
            
            {/* Progress Bar */}
            <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, width: '100%', marginBottom: 16 }}>
              <View style={{ height: '100%', backgroundColor: statusColor, borderRadius: 2, width: `${percentage}%` }} />
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
            {percentage >= target ? (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, marginTop: 8 }}>You can miss</Text>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{canMiss} more {canMiss === 1 ? unit : unitPlural}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>to maintain {target}%</Text>
              </>
            ) : (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, marginTop: 8 }}>You need to attend</Text>
                {classesNeeded === Infinity ? (
                  <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '700', textAlign: 'center' }}>Every remaining class</Text>
                ) : (
                  <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '700' }}>{classesNeeded} more {classesNeeded === 1 ? unit : unitPlural}</Text>
                )}
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>to reach {target}%</Text>
              </>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
