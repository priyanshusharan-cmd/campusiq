import * as SecureStore from 'expo-secure-store';

const KEY = 'campusiq.google-api-key';
export async function getGoogleApiKey(): Promise<string> {
  const saved = (await SecureStore.getItemAsync(KEY)) ?? '';
  if (saved) return saved;
  if (typeof process !== 'undefined' && process.env) {
    return (process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY ?? '').trim();
  }
  return '';
}
export async function setGoogleApiKey(value: string): Promise<void> {
  const key = value.trim();
  if (!key) { await SecureStore.deleteItemAsync(KEY); return; }
  await SecureStore.setItemAsync(KEY, key, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
}
