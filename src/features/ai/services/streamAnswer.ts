import { fetch } from 'expo/fetch';

/** Decode provider framing independently of network chunk/UTF-8 boundaries. */
export async function streamAnswer(url: string, body: unknown, headers: Record<string, string>, protocol: 'google' | 'ollama', timeout: number, onText: (text: string) => void): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let answer = '';
  let complete = false;
  let lastUpdate = 0;
  const consume = (payload: string) => {
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
    if (answer && Date.now() - lastUpdate >= 40) { onText(answer); lastUpdate = Date.now(); }
  };
  try {
    const response = await fetch(url, { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
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
    clearTimeout(timer);
    controller.abort();
    reader?.releaseLock();
  }
}
