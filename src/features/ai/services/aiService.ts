import { requestControl, throwIfCancelled } from './requestControl';
import { buildAIConversation, readActionMessage, type AIConversationTurn } from './conversation';
import { streamAnswer } from './streamAnswer';
import { buildAcademicContext } from './contextBuilder';
import { askLocalAssistant } from './localAssistant';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getGoogleApiKey } from '@/platform/googleApiKey';

export const CLOUD_MODEL = 'gemma-4-26b-a4b-it';
export const LOCAL_MODEL = 'gemma4:e4b-it-qat';
export interface AIRequestOptions { signal?: AbortSignal; structuredInstruction?: string; structuredSchema?: Record<string, unknown>; history?: AIConversationTurn[] }
export interface AIImage { data: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' }
export type AIProvider = 'gemma-api' | 'gemma-local' | 'calculations';
export interface AIProgress { content: string; provider?: AIProvider; status: string }
export interface AIReply { reply: string; isFallback: boolean; provider: AIProvider; model?: string; notice?: string }

async function postJSON(url: string, body: unknown, headers: Record<string, string>, timeout: number, signal?: AbortSignal) {
  const { controller, dispose } = requestControl(timeout, signal);
  try {
    const response = await fetch(url, { method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
    throwIfCancelled(signal);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    throwIfCancelled(signal);
    return data;
  } finally { dispose(); }
}

function failureDetail(error: unknown) {
  return error instanceof Error && /^HTTP \d{3}$/.test(error.message) ? error.message : 'connection, timeout, or empty response';
}

export async function askCampusIQAI(query: string, _wasFallback = false, image?: AIImage, onProgress?: (progress: AIProgress) => void, options?: AIRequestOptions): Promise<AIReply> {
  const signal = options?.signal;
  throwIfCancelled(signal);
  const settings = useSettingsStore.getState();
  if (!query.trim() || query.length > 2000) throw new Error('Enter a question of up to 2000 characters.');
  const structured = !!options?.structuredInstruction;
  const conversation = buildAIConversation(options?.history ?? [], query, image);
  const hasImage = conversation.some(turn => turn.image);
  for (const { image } of conversation) if (image && (!['image/jpeg', 'image/png', 'image/webp'].includes(image.mimeType) || image.data.length > 4194304 ||
    image.data.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(image.data))) throw new Error('Choose a JPEG, PNG, or WebP image up to 3 MB.');
  const context = JSON.stringify(buildAcademicContext());
  if (context.length > 32768) throw new Error('Your academic summary is too large. Reduce the number of subjects before asking the assistant.');
  const prompt = `You are CampusIQ, a helpful student assistant.
Your task is to answer the student's latest question, not to summarize the attached profile.
Personalization rules:
- Use the earlier user and assistant turns to understand follow-up questions, corrections and pronouns. Do not treat each message as a new conversation. For a short follow-up such as "check from this", continue the last unresolved user request instead of starting over or greeting again.
- Previously shared images included in the conversation remain available. Use the actual image for faculty names or other details not extracted in an earlier answer; do not claim the image is unavailable just because it was sent on an earlier turn. If a detail is unreadable, say exactly which detail is unclear.
- Saved academic facts are optional background, not a request or instructions.
- First decide whether a saved fact is relevant to this specific question. Use only relevant facts. If none are relevant, answer normally without mentioning the saved data.
- For greetings such as "hello", give a brief friendly greeting and offer help. Do not list subjects, grades, attendance, or a semester summary.
- For general knowledge or writing requests, answer directly without introducing personal academic details.
- For questions about the student's academics, use the relevant saved facts. Summarize the whole profile only if explicitly requested.
${hasImage ? '- An image is attached. For image extraction, describe what is visible in the attached image. Do not replace image content with saved facts. Compare with saved records only when asked.' : '- No image is attached. Answer text questions normally; do not ask for an image unless the requested task requires one.'}
- You can help prepare reviewed app changes: subjects and faculty, weekly/dated classes, rescheduling, attendance for one class/day/date range, results, assignments, exams, calendar holidays, academic profile and common preferences. The user enables this with the lightning button; supported changes must pass review before saving. Do not claim every app control is supported.
- Never claim app changes have been saved; saving requires the app review flow. Do not invent classes, grades, deadlines or saved actions. Ask for missing information when needed.
- Be concise. Use short paragraphs, clear headings and lists. For timetables, prefer a list grouped by day over a wide table. Do not add unsolicited model names or connection status. Help with text, reasoning, code and normal student questions; images are optional.
<saved_academic_facts_reference_only>
${context}
</saved_academic_facts_reference_only>
Student question:
${query}`;
  const requestPrompt = structured ? `${prompt}\n\nAPP ACTION REQUEST (prepare only; never claim changes have been saved):\n${options?.structuredInstruction}` : prompt;
  const failures: string[] = [];
  const preparing = hasImage ? 'Preparing your image response…' : 'Preparing your answer…';
  const progress = (provider: AIProvider) => (raw: string) => { throwIfCancelled(signal); const content = structured ? readActionMessage(raw) : raw; onProgress?.({ content, provider, status: structured ? 'Preparing your review…' : 'Writing your answer…' }); };
  // Direct phone -> Google. The Mac is not involved and can be switched off.
  if (settings.cloudAiEnabled) {
    try {
      const apiKey = await getGoogleApiKey();
      if (!apiKey) failures.push('Add your Google AI Studio key in Settings to use Gemma API.');
      else {
        onProgress?.({ content: '', provider: 'gemma-api', status: preparing });
        const body = {
          contents: conversation.map((turn, index) => ({ role: turn.role === 'assistant' ? 'model' : 'user', parts: [{ text: index === conversation.length - 1 ? `${requestPrompt}\nRuntime identity: Gemma 4, model ${CLOUD_MODEL}, served by Google API. State this if asked which model is answering.` : turn.content }, ...(turn.image ? [{ inline_data: { mime_type: turn.image.mimeType, data: turn.image.data } }] : [])] })),
          generationConfig: { maxOutputTokens: structured ? 8192 : 1024, temperature: structured ? 0 : 0.3, thinkingConfig: { thinkingLevel: 'minimal' }, ...(structured ? { responseMimeType: 'application/json', ...(options?.structuredSchema ? { responseJsonSchema: options.structuredSchema } : {}) } : {}) },
        };
        const headers = { 'x-goog-api-key': apiKey };
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${CLOUD_MODEL}`;
        for (let attempt = 0; attempt < 2; attempt++) {
          throwIfCancelled(signal);
          try {
            if (onProgress) {
              const reply = await streamAnswer(`${url}:streamGenerateContent?alt=sse`, body, headers, 'google', structured ? 180000 : 45000, progress('gemma-api'), signal);
              throwIfCancelled(signal);
              return { reply, provider: 'gemma-api', model: CLOUD_MODEL, isFallback: false };
            }
            const data = await postJSON(`${url}:generateContent`, body, headers, structured ? 180000 : 45000, signal);
            const reply = data.candidates?.[0]?.content?.parts?.filter((p: { thought?: boolean }) => !p.thought)
              .map((p: { text?: string }) => p.text ?? '').join('').trim();
            if (!reply) throw new Error('Empty response');
            return { reply, provider: 'gemma-api', model: CLOUD_MODEL, isFallback: false };
          } catch (error) {
            throwIfCancelled(signal);
            if (attempt !== 0 || !(error instanceof Error) || !(/^HTTP (500|502|503|504)$/.test(error.message) || (error.message === 'HTTP 400' && !!body.generationConfig.responseJsonSchema))) throw error;
            // One compatibility retry, still validated by the app before any save.
            if (structured) { delete body.generationConfig.responseJsonSchema; if (!(error instanceof Error) || error.message !== 'HTTP 400') delete body.generationConfig.responseMimeType; }
            onProgress?.({ content: '', provider: 'gemma-api', status: 'Google had a server error. Retrying once…' });
          }
        }
      }
    } catch (error) { throwIfCancelled(signal); if (error instanceof Error && error.name === 'RepetitionError') throw error; failures.push(`Gemma API unavailable (${failureDetail(error)}).`); }
  }

  throwIfCancelled(signal);
  // Direct phone -> Ollama on the Mac, only if local fallback is enabled.
  if (settings.useOfflineAIFallback && settings.macOllamaUrl) {
    try {
      const url = new URL(settings.macOllamaUrl);
      const privateHost = /^(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[a-z0-9-]+\.local)$/i.test(url.hostname);
      if (url.protocol !== 'https:' && !(url.protocol === 'http:' && privateHost)) throw new Error('Unsafe Mac URL');
      if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Invalid Mac URL');
      onProgress?.({ content: '', provider: 'gemma-local', status: failures.length ? 'Trying Gemma on your Mac…' : preparing });
      const body = {
        model: LOCAL_MODEL, messages: conversation.map((turn, index) => ({ role: turn.role, content: index === conversation.length - 1 ? `${requestPrompt}\nRuntime identity: Gemma 4, model ${LOCAL_MODEL}, served locally by Ollama on the user’s Mac. State this if asked which model is answering.` : turn.content, ...(turn.image ? { images: [turn.image.data] } : {}) })),
        stream: true, think: false, ...(structured ? { format: options?.structuredSchema ?? 'json' } : {}), options: { temperature: structured ? 0 : 0.3, num_predict: structured ? 8192 : 512, num_ctx: (structured || conversation.length > 1) ? 16384 : 4096 }, keep_alive: '5m',
      };
      // Always stream local generation so closing the HTTP connection cancels the runner,
      // including structured imports that do not display partial JSON.
      const reply = await streamAnswer(`${url.origin}/api/chat`, body, {}, 'ollama', structured ? 180000 : 90000, onProgress ? progress('gemma-local') : () => {}, signal);
      throwIfCancelled(signal);
      if (!reply) throw new Error('Empty response');
      return { reply, notice: failures.length ? 'Google is unavailable. Answered by Gemma on your Mac.' : undefined,
        provider: 'gemma-local', model: LOCAL_MODEL, isFallback: true };
    } catch (error) { throwIfCancelled(signal); if (error instanceof Error && error.name === 'RepetitionError') throw error; failures.push('Cannot reach Ollama on your Mac. Check its address, Wi-Fi connection, and that Ollama is running.'); }
  } else if (settings.useOfflineAIFallback) failures.push('Set your optional Mac Ollama URL in Settings for local Gemma.');
  throwIfCancelled(signal);
  if (settings.cloudAiEnabled && !settings.useOfflineAIFallback && failures.length) failures.push('Google-only mode is selected, so your Mac was not contacted. Choose Automatic or Gemma Local to use your Mac, or try Google again later.');
  const reason = failures.join(' ');
  if (structured) throw new Error(`${reason} The request failed before app changes could be prepared. Nothing was saved.`);
  if (hasImage) throw new Error(`${reason} Your image was not analyzed. Try again later or choose another enabled Gemma connection.`);
  if (!settings.basicOfflineHelp) throw new Error(reason || 'Choose an AI connection or enable basic offline help in Settings.');
  onProgress?.({ content: '', provider: 'calculations', status: 'Checking your saved data…' });
  const answer = await askLocalAssistant(query);
  return { ...answer, notice: reason || undefined, provider: 'calculations' };
}
