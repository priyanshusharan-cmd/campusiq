import type { AIImage } from '@/features/ai/services/aiService';

export async function readDroppedImage(files: ArrayLike<File>): Promise<AIImage & { uri: string }> {
  if (files.length !== 1) throw new Error('Drop one image at a time.');
  const file = files[0];
  if (file.size > 3 * 1024 * 1024) throw new Error('Choose an image smaller than 3 MB.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG, or WebP image.');
  const uri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read this image.'));
    reader.onerror = () => reject(new Error('Could not read this image. Try another file.'));
    reader.onabort = () => reject(new Error('Image loading was cancelled.'));
    reader.readAsDataURL(file);
  });
  const data = uri.slice(uri.indexOf(',') + 1);
  const mimeType = data.startsWith('/9j/') ? 'image/jpeg' : data.startsWith('iVBORw0KGgo') ? 'image/png' : data.startsWith('UklGR') ? 'image/webp' : null;
  if (!mimeType || !data.length || data.length > 4194304) throw new Error('Choose a valid JPEG, PNG, or WebP image up to 3 MB.');
  return { uri: `data:${mimeType};base64,${data}`, data, mimeType };
}
