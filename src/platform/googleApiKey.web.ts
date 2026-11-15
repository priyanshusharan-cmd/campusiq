// Browser demo keys stay in memory only. Reloading the page clears the key.
let sessionKey = '';
export async function getGoogleApiKey(): Promise<string> {
  if (sessionKey) return sessionKey;
  // Bring-your-own-key only: never fall back to a build-time key, so no key can be baked into a build.
  return '';
}
export async function setGoogleApiKey(value: string): Promise<void> { sessionKey = value.trim(); }
