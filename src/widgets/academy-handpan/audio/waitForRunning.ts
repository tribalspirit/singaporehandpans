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

/**
 * Bound any awaited step of audio start-up.
 *
 * Bounding the state poll was not enough. `Tone.start()` resolves only once the
 * underlying `AudioContext.resume()` does, and autoplay policy can leave that
 * pending indefinitely — in which case execution never reaches the poll at all,
 * the initialisation promise never settles, and every later gesture reuses the
 * stuck promise. The fix has to sit on each await that can hang, not on the one
 * that happened to hang first.
 *
 * Rejecting lets the caller's `finally` clear its in-flight handle, so the next
 * gesture starts fresh rather than inheriting a dead promise.
 */
export async function withTimeout<T>(
  work: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const expiry = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  try {
    return await Promise.race([work, expiry]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}
