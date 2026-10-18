import type { AIImage } from './aiService';

export interface AIConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  image?: AIImage;
  id?: string;
  pending?: boolean;
  failed?: boolean;
}

/** Keep recent context and one source image, without duplicating its base64 in every turn. */
export function buildAIConversation(history: AIConversationTurn[], query: string, image?: AIImage): AIConversationTurn[] {
  const complete = history.filter(turn => !turn.pending && !turn.failed && !(turn.role === 'assistant' && isRepetitiveReply(turn.content)) && turn.id !== 'welcome' && (turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string');
  const imageTurn = image ? undefined : [...complete].reverse().find(turn => turn.role === 'user' && turn.image);
  const recent: AIConversationTurn[] = [];
  let remaining = 12000;
  for (let index = complete.length - 1; index >= 0 && recent.length < 12 && remaining > 0; index--) {
    const turn = complete[index];
    const content = turn.content.slice(0, Math.min(4000, remaining));
    remaining -= content.length;
    recent.unshift({ role: turn.role, content, ...(turn === imageTurn ? { image: turn.image } : {}) });
  }
  // Google conversation history starts with a user; keep complete recent exchanges.
  while (recent[0]?.role === 'assistant') recent.shift();
  if (imageTurn && !recent.some(turn => turn.image)) {
    recent.unshift({ role: 'user', content: `Earlier image shared in this conversation (reference only): ${imageTurn.content.slice(0, 600)}`, image: imageTurn.image });
  }
  return [...recent, { role: 'user', content: query, ...(image ? { image } : {}) }];
}

/** Expose only the user-facing message from incomplete action JSON, never edit data. */
export function readActionMessage(source: string): string {
  const match = /"message"\s*:\s*"/.exec(source);
  if (!match) return '';
  let text = '';
  const escapes: Record<string, string> = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '"': '"', '\\': '\\', '/': '/' };
  for (let i = match.index + match[0].length; i < source.length; i++) {
    const char = source[i];
    if (char === '"') break;
    if (char !== '\\') { text += char; continue; }
    const escape = source[++i];
    if (!escape) break;
    if (escape === 'u') {
      const hex = source.slice(i + 1, i + 5);
      if (!/^[a-f0-9]{4}$/i.test(hex)) break;
      text += String.fromCharCode(parseInt(hex, 16)); i += 4;
    } else if (escape in escapes) text += escapes[escape];
    else break;
  }
  return text;
}

/** Detect a long, consecutive prose loop; ordinary recurring table values are retained. */
export function isRepetitiveReply(source: string): boolean {
  const words = source.slice(-6000).toLowerCase().match(/[a-z0-9]+/g) ?? [];
  // The last token may be an incomplete streaming fragment.
  words.pop();
  if (words.length < 48) return false;
  for (let size = 1; size <= 8; size++) {
    const cycles = Math.max(8, Math.ceil(48 / size));
    const length = cycles * size;
    if (words.length < length) continue;
    const tail = words.slice(-length);
    if (!tail.slice(0, size).some(word => /[a-z]{2}/.test(word))) continue;
    if (tail.every((word, index) => word === tail[index % size])) return true;
  }
  return false;
}
