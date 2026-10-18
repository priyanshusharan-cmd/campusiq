export function throwIfCancelled(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const error = new Error('Request cancelled.');
    error.name = 'AbortError';
    throw error;
  }
}

/** Share a screen's cancellation with each provider attempt while keeping its own timeout. */
export function requestControl(timeout: number, signal?: AbortSignal) {
  throwIfCancelled(signal);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  const timer = setTimeout(abort, timeout);
  return {
    controller,
    dispose: () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); },
  };
}
