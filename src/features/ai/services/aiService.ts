import { buildAcademicContext } from './contextBuilder';
import { askLocalAssistant } from './localAssistant';
import { useSettingsStore } from '@/stores/useSettingsStore';

export interface AIImage { data: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' }

export type AIProvider = 'gemma-api' | 'gemma-local' | 'calculations';
export interface AIReply {
  reply: string;
  isFallback: boolean;
  provider: AIProvider;
  model?: string;
}

export async function askCampusIQAI(query: string, _wasFallback = false, image?: AIImage): Promise<AIReply> {
  const settings = useSettingsStore.getState();
  let reason = 'Connect an AI Server URL in Settings to use Gemma.';
  if (!query.trim() || query.length > 2000) throw new Error('Enter a question of up to 2000 characters.');
  // Always retry the API on the next question, even after a previous fallback.
  if (settings.aiServerUrl) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 145000);
    try {
      const url = new URL(settings.aiServerUrl);
      const localHost = /^(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(url.hostname);
      if (url.protocol !== 'https:' && !(url.protocol === 'http:' && localHost)) throw new Error('Use HTTPS or a local-network server URL.');
      if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Enter only the server origin, for example http://localhost:8787.');
      const response = await fetch(`${url.origin}/api/chat`, {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...(settings.aiServerToken ? { Authorization: `Bearer ${settings.aiServerToken}` } : {}) },
        body: JSON.stringify({ query, context: buildAcademicContext(), allowCloud: settings.cloudAiEnabled, allowLocal: settings.useOfflineAIFallback, ...(image ? { image: { data: image.data, mimeType: image.mimeType } } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gemma server unavailable.');
      if (typeof data.reply !== 'string' || !data.reply.trim() || !['gemma-api', 'gemma-local'].includes(data.provider)) throw new Error('Invalid Gemma server response.');
      const label = data.provider === 'gemma-api' ? 'Gemma API' : 'Gemma on your Mac';
      return { reply: `${label}${data.model ? ` · ${data.model}` : ''}\n\n${data.notice ? `${data.notice}\n\n` : ''}${data.reply}`,
        provider: data.provider, model: data.model, isFallback: data.provider !== 'gemma-api' };
    } catch (error) {
      reason = error instanceof Error ? error.message : 'Could not reach your Gemma server.';
    } finally { clearTimeout(timer); }
  }
  if (image) throw new Error(`${reason} Your image was not analyzed. Connect a Gemma model and try again.`);
  if (!settings.useOfflineAIFallback) throw new Error(reason);
  const answer = await askLocalAssistant(query);
  return { ...answer, reply: `${reason}\n\n${answer.reply}`, provider: 'calculations' };
}
