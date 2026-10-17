// Browser demo keys stay in memory only. Reloading the page clears the key.
let sessionKey = '';
export async function getGoogleApiKey(): Promise<string> { return sessionKey; }
export async function setGoogleApiKey(value: string): Promise<void> { sessionKey = value.trim(); }
