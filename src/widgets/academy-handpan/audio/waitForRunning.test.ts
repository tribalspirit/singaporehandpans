import { describe, it, expect, vi, afterEach } from 'vitest';
import { waitForRunningContext } from './waitForRunning';

/**
 * The bound is the point of this helper, so it is what gets tested.
 *
 * Without it a context that never starts left the caller's promise pending
 * forever, which silently killed audio for the rest of the page's life.
 */
describe('waitForRunningContext', () => {
  afterEach(() => vi.useRealTimers());

  it('resolves immediately when the context is already running', async () => {
    await expect(waitForRunningContext(() => 'running')).resolves.toBe(true);
  });

  it('resolves true once the context starts', async () => {
    vi.useFakeTimers();
    let state = 'suspended';
    const pending = waitForRunningContext(() => state, {
      timeoutMs: 1000,
      pollIntervalMs: 10,
    });

    state = 'running';
    await vi.advanceTimersByTimeAsync(20);

    await expect(pending).resolves.toBe(true);
  });

  /** The regression that matters: it must give up rather than hang. */
  it('gives up rather than polling forever', async () => {
    vi.useFakeTimers();
    const pending = waitForRunningContext(() => 'suspended', {
      timeoutMs: 200,
      pollIntervalMs: 10,
    });

    await vi.advanceTimersByTimeAsync(500);

    await expect(pending).resolves.toBe(false);
  });

  it('stops polling after it gives up', async () => {
    vi.useFakeTimers();
    const getState = vi.fn(() => 'suspended');

    await Promise.all([
      waitForRunningContext(getState, { timeoutMs: 100, pollIntervalMs: 10 }),
      vi.advanceTimersByTimeAsync(400),
    ]);

    const callsAtGiveUp = getState.mock.calls.length;
    await vi.advanceTimersByTimeAsync(400);

    expect(getState.mock.calls.length).toBe(callsAtGiveUp);
  });
});

/**
 * A failed module load must not be cached.
 *
 * `warmAudioModule` memoises its import so repeated pointerdowns share one
 * request. If a transient failure were memoised too, every later call would
 * receive the same rejection — and since the pointer handler deliberately
 * swallows it, audio would never recover until reload. That is the same
 * permanent-failure shape as an unbounded start poll, reached a different way.
 */
describe('memoised loads must not cache a failure', () => {
  async function makeWarmer(loader: () => Promise<string>) {
    let cached: Promise<string> | null = null;
    return () => {
      if (!cached) {
        cached = loader().catch((error) => {
          cached = null;
          throw error;
        });
      }
      return cached;
    };
  }

  it('retries after a failure instead of replaying it', async () => {
    let attempt = 0;
    const loader = vi.fn(async () => {
      attempt += 1;
      if (attempt === 1) throw new Error('network');
      return 'loaded';
    });

    const warm = await makeWarmer(loader);

    await expect(warm()).rejects.toThrow('network');
    await expect(warm()).resolves.toBe('loaded');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('still shares a single in-flight request on success', async () => {
    const loader = vi.fn(async () => 'loaded');
    const warm = await makeWarmer(loader);

    await Promise.all([warm(), warm(), warm()]);

    expect(loader).toHaveBeenCalledTimes(1);
  });
});
