// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HandpanWidget from './HandpanWidget';

/**
 * What the hook must not do once its widget is gone.
 *
 * `playSingleNote` retries once, because a first gesture can land while Tone is
 * still downloading. But a disposed engine rebuilds on `initialize` by design —
 * that is what makes StrictMode's mount/unmount/mount harmless — so an
 * unconditional retry after unmount built a `PolySynth`, wired it to the
 * output, and sounded a note over the next page, with nothing left to dispose
 * it.
 */

const engine = vi.hoisted(() => {
  const stub = {
    initialize: vi.fn(),
    isInitialized: vi.fn(),
    playNote: vi.fn(),
    playChord: vi.fn(),
    playArpeggio: vi.fn(),
    stopArpeggio: vi.fn(),
    dispose: vi.fn(),
    /** Resolves the pending `initialize`. */
    finishInitialize: () => {},
    /** True once `dispose` has run, mirroring the real engine's state. */
    disposed: false,
  };
  return stub;
});

vi.mock('../audio/createAudioEngine', () => ({
  createAudioEngine: () => engine,
}));
vi.mock('../audio/engine', () => ({
  warmAudioModule: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  engine.disposed = false;

  // Never ready, so every gesture goes through `initialize`.
  engine.isInitialized.mockReturnValue(false);

  engine.initialize.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        engine.finishInitialize = () => {
          // A disposal during the await wins. The real engine checks its
          // lifecycle generation after each await and builds nothing, so it
          // resolves still holding no synth — `disposed` deliberately stays as
          // it is rather than being cleared here.
          resolve();
        };
      })
  );

  // The real synth is gone after disposal, so playing throws exactly as it does
  // before any initialisation.
  engine.playNote.mockImplementation(() => {
    if (engine.disposed) {
      throw new Error('Audio not initialized. Call initializeAudio() first.');
    }
  });

  engine.dispose.mockImplementation(() => {
    engine.disposed = true;
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('useScaleAudio after unmount', () => {
  it('does not retry a note once the widget has gone away', async () => {
    const user = userEvent.setup();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(<HandpanWidget />);

    // A pad tap that is still waiting on the audio engine.
    await user.click(screen.getByRole('button', { name: /^Pad 1,/ }));
    expect(engine.initialize).toHaveBeenCalledTimes(1);

    // The visitor navigates away before it resolves.
    unmount();
    expect(engine.dispose).toHaveBeenCalled();

    await act(async () => {
      engine.finishInitialize();
      await Promise.resolve();
    });

    // The retry must not rebuild an engine nothing owns any more.
    expect(engine.initialize).toHaveBeenCalledTimes(1);
    expect(engine.playNote).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('still retries while the widget is mounted', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<HandpanWidget />);

    await user.click(screen.getByRole('button', { name: /^Pad 1,/ }));

    // The first attempt resolves with nothing usable, as a gesture landing
    // mid-download does, so `sound()` throws and the retry is warranted.
    engine.playNote.mockImplementationOnce(() => {
      throw new Error('Audio not initialized. Call initializeAudio() first.');
    });

    await act(async () => {
      engine.finishInitialize();
      await Promise.resolve();
    });

    expect(engine.initialize).toHaveBeenCalledTimes(2);
    unmount();
  });
});
