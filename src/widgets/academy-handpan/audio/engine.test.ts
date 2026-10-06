import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadToneModule, startAudioContext } from './engine';

/**
 * Starting the page's audio context, once per gesture rather than once per page.
 *
 * The context is shared — a document gets one, and resuming it twice buys
 * nothing — but the *attempt* to resume must not be. `tone.start()` resolves
 * only when `AudioContext.resume()` does, and a resume made without a live user
 * activation can sit pending until the timeout. Handing that stuck promise to
 * the next widget spends its perfectly good gesture on the first widget's dead
 * one, and both then fail.
 */

const fakeContext = { state: 'suspended' };
const start = vi.fn();

vi.mock('tone', () => ({
  context: fakeContext,
  start,
  PolySynth: class {},
  Synth: class {},
}));

beforeEach(async () => {
  fakeContext.state = 'suspended';
  start.mockReset();
  start.mockResolvedValue(undefined);
  await loadToneModule();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('startAudioContext', () => {
  it('does nothing once the context is already running', async () => {
    fakeContext.state = 'running';

    await startAudioContext();

    expect(start).not.toHaveBeenCalled();
  });

  it('resumes the context when it is suspended', async () => {
    start.mockImplementation(async () => {
      fakeContext.state = 'running';
    });

    await startAudioContext();

    expect(start).toHaveBeenCalledTimes(1);
  });

  /**
   * The case that matters for two widgets: the first one's resume is stuck
   * because its activation expired, and the visitor clicks the second. That
   * click is a fresh, valid activation and must get its own attempt.
   */
  it('gives a later gesture its own attempt while an earlier one is stuck', async () => {
    vi.useFakeTimers();

    // The first widget's resume never settles.
    start.mockImplementationOnce(() => new Promise<void>(() => {}));
    // The second widget's gesture is live, so its resume works.
    start.mockImplementationOnce(async () => {
      fakeContext.state = 'running';
    });

    const stuck = startAudioContext().catch((error) => error);
    const fresh = startAudioContext().catch((error) => error);

    expect(start).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(4000);

    await expect(fresh).resolves.toBeUndefined();
    expect(fakeContext.state).toBe('running');
    // The abandoned attempt settles as a timeout rather than hanging about.
    await expect(stuck).resolves.toBeInstanceOf(Error);
  });

  it('lets a later gesture retry after an earlier one timed out', async () => {
    vi.useFakeTimers();

    start.mockImplementationOnce(() => new Promise<void>(() => {}));
    const failed = startAudioContext().catch((error) => error);
    await vi.advanceTimersByTimeAsync(4000);
    await expect(failed).resolves.toBeInstanceOf(Error);

    start.mockImplementationOnce(async () => {
      fakeContext.state = 'running';
    });
    const retried = startAudioContext();
    await vi.advanceTimersByTimeAsync(100);

    await expect(retried).resolves.toBeUndefined();
  });
});
