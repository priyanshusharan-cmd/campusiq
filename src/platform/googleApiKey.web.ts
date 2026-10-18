// Browser demo keys stay in memory only. Reloading the page clears the key.
let sessionKey = '';
export async function getGoogleApiKey(): Promise<string> {
  if (sessionKey) return sessionKey;
  if (typeof process !== 'undefined' && process.env) {
    return (process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY ?? '').trim();
  }
  return '';
}
export async function setGoogleApiKey(value: string): Promise<void> { sessionKey = value.trim(); }
