import * as SecureStore from 'expo-secure-store';

const KEY = 'campusiq.google-api-key';
export async function getGoogleApiKey(): Promise<string> {
  return (await SecureStore.getItemAsync(KEY)) ?? '';
}
export async function setGoogleApiKey(value: string): Promise<void> {
  const key = value.trim();
  if (!key) { await SecureStore.deleteItemAsync(KEY); return; }
  await SecureStore.setItemAsync(KEY, key, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
}
