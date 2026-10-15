// Short-lived export files; user data is persisted by the existing stores.
export const cacheDirectory = 'campusiq-export://';
export const EncodingType = { UTF8: 'utf8' } as const;
export const exportFiles = new Map<string, { content: string; mimeType: string }>();
export async function writeAsStringAsync(uri: string, content: string, _options?: unknown) {
  exportFiles.set(uri, { content, mimeType: 'application/json' });
}
export async function readAsStringAsync(uri: string, _options?: unknown) {
  const exported = exportFiles.get(uri);
  if (exported) return exported.content;
  // Expo DocumentPicker returns a local blob/data URL in the browser.
  if (!uri.startsWith('blob:') && !uri.startsWith('data:')) throw new Error('Please select a local JSON file.');
  const response = await fetch(uri);
  if (!response.ok) throw new Error('Unable to read the selected file.');
  return response.text();
}
