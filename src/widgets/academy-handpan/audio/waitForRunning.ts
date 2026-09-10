/**
 * Wait for an audio context to reach `running`, with a bound.
 *
 * The previous inline version polled forever with no timeout and no reject
 * path. If the context never started — autoplay policy refusing, or the user
 * activation having expired while the Tone chunk downloaded — the promise never
 * settled, so the caller's `finally` never ran, `initializationPromise` stayed
 * pending, and every later call returned that same dead promise. Audio was gone
 * until a page reload.
 *
 * Bounding it turns a permanent failure into a retryable one: the promise
 * settles, the caller clears its in-flight handle, and the next gesture tries
 * again — by which point the module is cached, so the slow path that caused the
 * failure is gone.
 */
export const CONTEXT_START_TIMEOUT_MS = 3000;
const POLL_INTERVAL_MS = 50;

export async function waitForRunningContext(
  getState: () => string,
  options: { timeoutMs?: number; pollIntervalMs?: number } = {}
): Promise<boolean> {
  const timeoutMs = options.timeoutMs ?? CONTEXT_START_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? POLL_INTERVAL_MS;

  if (getState() === 'running') {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    const startedAt = Date.now();

    const check = () => {
      if (getState() === 'running') {
        resolve(true);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        resolve(false);
        return;
      }

      setTimeout(check, pollIntervalMs);
    };

    setTimeout(check, pollIntervalMs);
  });
}
