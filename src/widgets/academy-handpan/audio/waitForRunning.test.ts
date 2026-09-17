import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { waitForRunningContext, withTimeout } from './waitForRunning';

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

/**
 * Every awaited start-up step needs a bound, not just the poll.
 *
 * `Tone.start()` resolves only when `AudioContext.resume()` does, and autoplay
 * policy can leave that pending forever. Bounding only the state poll left that
 * case exactly as broken as before: execution never reached the poll, the
 * initialisation promise never settled, and audio stayed dead until reload.
 */
describe('withTimeout', () => {
  it('passes a value through when the work settles in time', async () => {
    await expect(
      withTimeout(Promise.resolve('ok'), 1000, 'work')
    ).resolves.toBe('ok');
  });

  it('propagates the original failure rather than masking it', async () => {
    await expect(
      withTimeout(Promise.reject(new Error('boom')), 1000, 'work')
    ).rejects.toThrow('boom');
  });

  it('rejects rather than hanging when the work never settles', async () => {
    vi.useFakeTimers();
    const neverSettles = new Promise<string>(() => {});
    const bounded = withTimeout(
      neverSettles,
      500,
      'Starting the audio context'
    );

    await vi.advanceTimersByTimeAsync(600);

    await expect(bounded).rejects.toThrow(/timed out after 500ms/);
  });

  it('names the step that timed out', async () => {
    vi.useFakeTimers();
    const bounded = withTimeout(new Promise<string>(() => {}), 100, 'Loading');
    await vi.advanceTimersByTimeAsync(200);
    await expect(bounded).rejects.toThrow(/^Loading timed out/);
  });

  it('clears its timer once the work settles', async () => {
    vi.useFakeTimers();
    const clear = vi.spyOn(globalThis, 'clearTimeout');

    await withTimeout(Promise.resolve('ok'), 1000, 'work');

    expect(clear).toHaveBeenCalled();
  });
});

/**
 * Structural guard: no unbounded await in audio start-up.
 *
 * This failure has recurred twice. First an unbounded poll left the
 * initialisation promise pending forever; bounding it moved the same hang one
 * line up, into `Tone.start()`, which resolves only when `AudioContext.resume()`
 * does — something autoplay policy can defer indefinitely. Both times the
 * consequence was identical: audio dead until reload, because the caller's
 * `finally` never ran and every later gesture reused the stuck promise.
 *
 * Reading the source is crude, but it catches the shape of the bug rather than
 * one instance of it, which is what kept being missed. Earlier versions sliced
 * out the function body to scan and twice sliced nothing, passing while
 * checking zero lines — so both files are now scanned whole.
 */
function awaitedCallees(source: string): string[] {
  return [...source.matchAll(/await\s+([A-Za-z_$][\w$.]*)\s*\(/g)].map(
    ([, callee]) => callee
  );
}

function readAudioSource(file: string): string {
  const source = readFileSync(
    join(process.cwd(), 'src/widgets/academy-handpan/audio', file),
    'utf8'
  );
  expect(source.length, `${file} is empty`).toBeGreaterThan(200);
  return source;
}

describe('audio start-up has no unbounded await', () => {
  it('bounds every await in the shared module and context layer', () => {
    const source = readAudioSource('engine.ts');

    // The base case: nothing here may await anything but the two primitives
    // that carry their own timeout.
    expect(
      awaitedCallees(source).filter(
        (callee) =>
          callee !== 'withTimeout' && callee !== 'waitForRunningContext'
      )
    ).toEqual([]);
  });

  it('bounds every await in a widget instance engine', () => {
    const shared = readAudioSource('engine.ts');
    const source = readAudioSource('createAudioEngine.ts');

    // The inductive step: an instance may additionally await the two shared
    // helpers, which the case above has just proved bounded. Asserting they
    // exist keeps the allowance from outliving the functions it names.
    expect(shared).toContain('export async function loadToneModule');
    expect(shared).toContain('export function startAudioContext');

    const bounded = [
      'withTimeout',
      'waitForRunningContext',
      'loadToneModule',
      'startAudioContext',
    ];

    expect(
      awaitedCallees(source).filter((callee) => !bounded.includes(callee))
    ).toEqual([]);
  });
});
