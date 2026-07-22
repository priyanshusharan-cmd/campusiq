// Campora — More Drawer / Modal Route

import React from 'react';
import MoreScreen from '@/features/more/MoreScreen';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function MoreRoute() {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      {/* Invisible backdrop to dismiss */}
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      {/* Sidebar Content */}
      <View style={styles.sidebar}>
        <MoreScreen />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebar: {
    width: '80%',
    height: '100%',
    backgroundColor: '#fff', // We will let MoreScreen handle its own background if needed, or wrap it properly.
  }
});
