import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PaywallScreen() {
  const router = useRouter();
  const theme = useTheme();
  const setIsPro = useSettingsStore(s => s.setIsPro);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      // Fetch packages from RevenueCat
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        // Attempt to purchase the first available package
        const { customerInfo } = await Purchases.purchasePackage(offerings.current.availablePackages[0]);
        
        // Check if the 'campusiq_pro' entitlement is now active
        if (typeof customerInfo.entitlements.active['campusiq_pro'] !== 'undefined') {
          setIsPro(true);
          router.replace('/(modals)/campus-ai');
        }
      } else {
        Alert.alert('Error', 'No subscription packages found. Please check your RevenueCat dashboard.');
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Purchase Error', e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (typeof customerInfo.entitlements.active['campusiq_pro'] !== 'undefined') {
        setIsPro(true);
        Alert.alert("Success", "Purchases restored!");
        router.replace('/(modals)/campus-ai');
      } else {
        Alert.alert("No Purchases", "We couldn't find any active subscriptions to restore.");
      }
    } catch (e: any) {
      Alert.alert('Restore Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={28} color={theme.colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="sparkles" size={60} color={theme.colors.primary} />
        </View>

        <Text style={[styles.title, { color: theme.colors.text }]}>
          Unlock CampusIQ AI
        </Text>

        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Your personal academic advisor. Ask about your attendance, predict your SGPA, and strategize your semester.
        </Text>

        <View style={styles.featuresList}>
          <FeatureItem text="Unlimited AI Queries" theme={theme} />
          <FeatureItem text="Advanced Bedrock Models" theme={theme} />
          <FeatureItem text="Personalized Study Plans" theme={theme} />
        </View>

        <TouchableOpacity
          style={[styles.buyButton, { backgroundColor: theme.colors.primary }]}
          onPress={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.buyButtonText}>Unlock for $2.99 / month</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={loading}
        >
          <Text style={[styles.restoreButtonText, { color: theme.colors.textMuted }]}>
            Restore Purchases
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FeatureItem({ text, theme }: { text: string, theme: any }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
      <Text style={[styles.featureText, { color: theme.colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  featuresList: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 18,
    marginLeft: 12,
    fontWeight: '500',
  },
  buyButton: {
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: 'center',
    marginBottom: 16,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '500',
  }
});
