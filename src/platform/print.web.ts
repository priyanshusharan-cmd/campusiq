import { exportFiles } from './fileSystem.web';
export async function printToFileAsync({ html }: { html: string }) {
  const uri = `campusiq-export://report-${Date.now()}.html`;
  exportFiles.set(uri, { content: html, mimeType: 'text/html' });
  return { uri, numberOfPages: 1 };
}
