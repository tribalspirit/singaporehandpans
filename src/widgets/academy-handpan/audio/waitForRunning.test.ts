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
