import { isRepetitiveReply } from './conversation';
import { requestControl, throwIfCancelled } from './requestControl';
import { fetch } from 'expo/fetch';

/** Decode provider framing independently of network chunk/UTF-8 boundaries. */
export async function streamAnswer(url: string, body: unknown, headers: Record<string, string>, protocol: 'google' | 'ollama', timeout: number, onText: (text: string) => void, signal?: AbortSignal): Promise<string> {
  const { controller, dispose } = requestControl(timeout, signal);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let answer = '';
  let complete = false;
  let lastUpdate = 0;
  const cancelReader = () => { void reader?.cancel().catch(() => {}); };
  controller.signal.addEventListener('abort', cancelReader);
  const consume = (payload: string) => {
    throwIfCancelled(signal);
    if (!payload.trim() || payload === '[DONE]') return;
    const data = JSON.parse(payload);
    if (data.error) throw new Error('Provider stream error');
    if (protocol === 'google') {
      answer += data.candidates?.[0]?.content?.parts?.filter((part: { thought?: boolean }) => !part.thought).map((part: { text?: string }) => part.text ?? '').join('') ?? '';
      if (data.candidates?.[0]?.finishReason) complete = true;
    } else {
      answer += data.message?.content ?? '';
      if (data.done) complete = true;
    }
    if (isRepetitiveReply(answer)) { const error = new Error('The model started repeating itself, so generation was stopped. Nothing was saved. Try a new chat or another model.'); error.name = 'RepetitionError'; throw error; }
    if (answer && Date.now() - lastUpdate >= 40) { onText(answer); lastUpdate = Date.now(); }
  };
  try {
    const response = await fetch(url, { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
    throwIfCancelled(signal);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!response.body) throw new Error('Streaming response unavailable');
    reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let eventData: string[] = [];
    const line = (value: string) => {
      value = value.replace(/\r$/, '');
      if (protocol === 'ollama') { if (value.trim()) consume(value); }
      else if (!value) { if (eventData.length) consume(eventData.join('\n')); eventData = []; }
      else if (value.startsWith('data:')) eventData.push(value.slice(5).trimStart());
    };
    while (true) {
      const chunk = await reader.read();
      throwIfCancelled(signal);
      if (controller.signal.aborted) throw new Error('Request timed out.');
      buffer += chunk.done ? decoder.decode() : decoder.decode(chunk.value, { stream: true });
      let boundary: number;
      while ((boundary = buffer.indexOf('\n')) >= 0) { line(buffer.slice(0, boundary)); buffer = buffer.slice(boundary + 1); }
      if (chunk.done) break;
    }
    if (buffer) line(buffer);
    if (eventData.length) consume(eventData.join('\n'));
    if (!complete || !answer.trim()) throw new Error('Incomplete response');
    onText(answer.trim());
    return answer.trim();
  } finally {
    dispose();
    controller.signal.removeEventListener('abort', cancelReader);
    if (reader && !complete) { try { await reader.cancel(); } catch { /* Already closed by the transport. */ } }
    controller.abort();
    reader?.releaseLock();
  }
}
