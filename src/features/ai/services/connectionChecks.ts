import { CLOUD_MODEL, LOCAL_MODEL } from './aiService';

export function normalizeMacAddress(value: string): string {
  const input = value.trim();
  if (!input) throw new Error('Enter your Mac’s Wi-Fi address first.');
  const url = new URL(input.includes('://') ? input : `http://${input}`);
  const local = /^(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[a-z0-9-]+\.local)$/i.test(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) throw new Error('Use a private Wi-Fi address or a trusted HTTPS address.');
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Enter the address only, without a path, password, or query.');
  if (!url.port && url.protocol === 'http:') url.port = '11434';
  return url.origin;
}

async function readResponse(url: string, options: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      if (response.status === 429) throw new Error('Free quota reached. Try later or switch to your Mac.');
      if ([400, 401, 403].includes(response.status)) throw new Error('Access was refused. Check your API key and project access.');
      throw new Error(`Connection returned HTTP ${response.status}. Try again shortly.`);
    }
    return response.json();
  } finally { clearTimeout(timer); }
}

export async function checkGoogleConnection(apiKey: string): Promise<string> {
  if (!apiKey) throw new Error('Add your Google AI Studio API key first.');
  const data = await readResponse(`https://generativelanguage.googleapis.com/v1beta/models/${CLOUD_MODEL}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with OK.' }] }], generationConfig: { maxOutputTokens: 32, thinkingConfig: { thinkingLevel: 'minimal' } } }),
  });
  if (!data.candidates?.[0]?.content?.parts?.some((part: { text?: string; thought?: boolean }) => !part.thought && part.text?.trim())) throw new Error('Google responded without an answer. Try again shortly.');
  return 'Google returned a real Gemma response. Your Mac is not needed.';
}

export async function checkMacConnection(address: string): Promise<string> {
  const data = await readResponse(`${normalizeMacAddress(address)}/api/tags`, { method: 'GET' });
  if (!Array.isArray(data.models)) throw new Error('This address did not return an Ollama model list.');
  if (!data.models.some((model: { name?: string; model?: string }) => model.name === LOCAL_MODEL || model.model === LOCAL_MODEL)) throw new Error(`Ollama is reachable, but ${LOCAL_MODEL} is not installed.`);
  return 'Ollama is reachable and Gemma is installed. No answer was generated.';
}
