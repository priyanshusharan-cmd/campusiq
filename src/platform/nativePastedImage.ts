import { File } from 'expo-file-system';
import { parsePastedImage } from './pastedImage';

export async function readNativePastedImage(uris: string[]) {
  if (uris.length !== 1) throw new Error('Paste one image at a time.');
  const uri = uris[0];
  if (!uri.startsWith('file://')) throw new Error('The pasted photo must be a local image.');
  const file = new File(uri);
  if (!file.exists) throw new Error('This pasted photo is no longer available. Copy it again.');
  if (file.size > 3 * 1024 * 1024) throw new Error('Choose an image smaller than 3 MB, or use Choose photo.');
  const data = await file.base64();
  const mimeType = data.startsWith('/9j/') ? 'image/jpeg' : data.startsWith('iVBORw0KGgo') ? 'image/png' : data.startsWith('UklGR') ? 'image/webp' : null;
  if (!mimeType) throw new Error('Paste a JPEG, PNG or WebP photo.');
  // Use a data URL for the preview so the native temporary file need not survive navigation.
  return parsePastedImage(`data:${mimeType};base64,${data}`);
}
