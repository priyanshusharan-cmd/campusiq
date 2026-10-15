import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
export function initializePurchases() {
    // Initialize RevenueCat
    // You should replace these keys with your actual RevenueCat public API keys
    const REVENUECAT_API_KEY_IOS = "test_bjwTXnyrXakjIGkfkQnyIsiRdkm";
    const REVENUECAT_API_KEY_ANDROID = "test_bjwTXnyrXakjIGkfkQnyIsiRdkm";

    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });
    } else if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: REVENUECAT_API_KEY_ANDROID });
    }

    // Optional: Log level for debugging
    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
}
