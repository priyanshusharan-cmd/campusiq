import type { AIImage } from '@/features/ai/services/aiService';

export function parsePastedImage(rawUri: string): AIImage & { uri: string } {
  const uri = rawUri.trim().replace(/[\r\n\s]+/g, '');
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(uri);
  if (!match) throw new Error('Paste a JPEG, PNG or WebP image.');
  const [, declaredType, data] = match;
  if (data.length > 4194304) throw new Error('Choose an image smaller than 3 MB.');
  const mimeType = data.startsWith('/9j/') ? 'image/jpeg' : data.startsWith('iVBORw0KGgo') ? 'image/png' : data.startsWith('UklGR') ? 'image/webp' : null;
  if (!mimeType || mimeType !== declaredType || data.length % 4 !== 0) throw new Error('Could not read this image. Try Add image instead.');
  return { uri, data, mimeType };
}
