import { exportFiles } from './fileSystem.web';
export async function isAvailableAsync() { return typeof document !== 'undefined'; }
export async function shareAsync(uri: string, _options?: unknown) {
  const file = exportFiles.get(uri);
  if (!file) throw new Error('The export is no longer available. Please export again.');
  if (file.mimeType === 'text/html') {
    // Open the browser's print flow, which supports Save as PDF. Sandbox reports
    // so subject names and other user-entered strings cannot execute scripts.
    await new Promise<void>((resolve, reject) => {
      const frame = document.createElement('iframe');
      frame.title = 'CampusIQ printable report';
      frame.setAttribute('sandbox', 'allow-same-origin allow-modals');
      frame.style.cssText = 'position:fixed;width:1px;height:1px;left:-10000px;border:0;';
      frame.onload = () => {
        try {
          const target = frame.contentWindow;
          if (!target) throw new Error('Unable to open report.');
          target.addEventListener('afterprint', () => frame.remove(), { once: true });
          target.focus(); target.print(); resolve();
          setTimeout(() => frame.remove(), 120000);
        } catch (error) { frame.remove(); reject(error); }
      };
      frame.srcdoc = file.content;
      document.body.append(frame);
    });
  } else {
    const url = URL.createObjectURL(new Blob([file.content], { type: file.mimeType }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = uri.split('/').pop() || 'CampusIQ_Backup.json';
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  exportFiles.delete(uri);
}
