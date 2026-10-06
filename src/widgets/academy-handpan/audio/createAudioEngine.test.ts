import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createAudioEngine } from './createAudioEngine';

/**
 * Two widgets on one page must not share an instrument.
 *
 * Every field these tests reach for used to be module-level — one synth, one
 * `isInitialized`, one in-flight arpeggio — and the step scheduling ran on
 * `Tone.Transport`, which belongs to the document. The result was that a second
 * widget stole the first one's voice, its tempo, and its step callbacks, and
 * either one stopping stopped both.
 */

interface TriggeredNote {
  notes: string | string[];
  durationSeconds: number;
}

class FakePolySynth {
  static instances: FakePolySynth[] = [];

  disposed = false;
  triggered: TriggeredNote[] = [];

  constructor() {
    FakePolySynth.instances.push(this);
  }

  toDestination(): this {
    return this;
  }

  triggerAttackRelease(
    notes: string | string[],
    durationSeconds: number
  ): this {
    this.triggered.push({ notes, durationSeconds });
    return this;
  }

  dispose(): this {
    this.disposed = true;
    return this;
  }
}

const fakeContext = { state: 'running' };

vi.mock('tone', () => ({
  PolySynth: FakePolySynth,
  Synth: class {},
  context: fakeContext,
  start: vi.fn().mockResolvedValue(undefined),
}));

/**
 * Holds one step of `initialize` open so a test can unmount mid-flight, which
 * is the realistic case: a pad tapped, then the page navigated away from while
 * Tone is still downloading or the browser has yet to resume the context.
 *
 * `entered` resolves when the held step is actually reached, so a test can be
 * sure it is suspending the step it means to and not an earlier one.
 */
function createGate() {
  const gate = {
    hold: false,
    /** Let the held step finish. */
    open: () => {},
    /** Resolves once the held step has been reached. */
    entered: Promise.resolve<void>(undefined),
    reached: () => {},
    /** How many times the guarded step was invoked at all. */
    calls: 0,
    reset() {
      gate.hold = false;
      gate.calls = 0;
      gate.open = () => {};
      gate.entered = new Promise<void>((resolve) => {
        gate.reached = resolve;
      });
    },
    /** The held step's promise, resolved only by `open`. */
    wait() {
      gate.reached();
      return new Promise<void>((resolve) => {
        gate.open = () => resolve();
      });
    },
  };
  gate.reset();
  return gate;
}

const moduleGate = vi.hoisted(() => createGate());
const contextGate = vi.hoisted(() => createGate());

vi.mock('./engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./engine')>();
  return {
    ...actual,
    loadToneModule: async () => {
      moduleGate.calls += 1;
      if (moduleGate.hold) {
        await moduleGate.wait();
      }
      return actual.loadToneModule();
    },
    startAudioContext: async () => {
      contextGate.calls += 1;
      if (contextGate.hold) {
        await contextGate.wait();
        return;
      }
      return actual.startAudioContext();
    },
  };
});

/** Notes of a quarter note at this tempo, in milliseconds. */
function stepMs(bpm: number): number {
  return (60 / bpm) * 1000;
}

beforeEach(() => {
  FakePolySynth.instances = [];
  fakeContext.state = 'running';
  moduleGate.reset();
  contextGate.reset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createAudioEngine', () => {
  it('gives each instance its own synth', async () => {
    const first = createAudioEngine();
    const second = createAudioEngine();

    await first.initialize();
    await second.initialize();

    expect(FakePolySynth.instances).toHaveLength(2);
    expect(first.isInitialized()).toBe(true);
    expect(second.isInitialized()).toBe(true);
  });

  it('refuses to play before it has been initialised', () => {
    const engine = createAudioEngine();

    expect(() => engine.playNote('D3')).toThrow(/not initialized/i);
  });

  it('plays a note through its own synth', async () => {
    const engine = createAudioEngine();
    await engine.initialize();

    engine.playNote('D3', 400);

    const [voice] = FakePolySynth.instances;
    expect(voice.triggered).toEqual([{ notes: 'D3', durationSeconds: 0.4 }]);
  });

  it('keeps one instance playing when another is stopped', async () => {
    const stopped = createAudioEngine();
    const playing = createAudioEngine();
    await stopped.initialize();
    await playing.initialize();

    const stoppedSteps = vi.fn();
    const playingSteps = vi.fn();
    const bpm = 120;

    stopped.playArpeggio({
      notes: ['D3', 'E3', 'F3'],
      bpm,
      onStep: stoppedSteps,
    });
    playing.playArpeggio({
      notes: ['A3', 'B3', 'C4'],
      bpm,
      onStep: playingSteps,
    });

    // Both sound their first note.
    vi.advanceTimersByTime(0);
    expect(stoppedSteps).toHaveBeenCalledTimes(1);
    expect(playingSteps).toHaveBeenCalledTimes(1);

    stopped.stopArpeggio();
    vi.advanceTimersByTime(stepMs(bpm) * 3);

    expect(stoppedSteps).toHaveBeenCalledTimes(1);
    expect(playingSteps).toHaveBeenCalledTimes(3);
    expect(playingSteps).toHaveBeenLastCalledWith({
      note: 'C4',
      pitchClass: 'C',
      index: 2,
    });
  });

  it('lets each instance keep its own tempo', async () => {
    const slow = createAudioEngine();
    const fast = createAudioEngine();
    await slow.initialize();
    await fast.initialize();

    const slowSteps = vi.fn();
    const fastSteps = vi.fn();

    slow.playArpeggio({ notes: ['D3', 'E3'], bpm: 60, onStep: slowSteps });
    fast.playArpeggio({ notes: ['A3', 'B3'], bpm: 240, onStep: fastSteps });

    // 250 ms in: the fast instance has both notes, the slow one only its first.
    vi.advanceTimersByTime(250);
    expect(fastSteps).toHaveBeenCalledTimes(2);
    expect(slowSteps).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(750);
    expect(slowSteps).toHaveBeenCalledTimes(2);
  });

  it('replaces its own arpeggio rather than layering one over it', async () => {
    const engine = createAudioEngine();
    await engine.initialize();

    const first = vi.fn();
    const second = vi.fn();

    engine.playArpeggio({ notes: ['D3', 'E3', 'F3'], bpm: 120, onStep: first });
    engine.playArpeggio({ notes: ['A3', 'B3'], bpm: 120, onStep: second });

    vi.advanceTimersByTime(stepMs(120) * 3);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(2);
  });

  it('reports completion once the last step has sounded', async () => {
    const engine = createAudioEngine();
    await engine.initialize();

    const onComplete = vi.fn();
    engine.playArpeggio({ notes: ['D3', 'E3'], bpm: 120, onComplete });

    vi.advanceTimersByTime(stepMs(120) * 2 - 1);
    expect(onComplete).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not schedule an arpeggio that was stopped while the context resumed', async () => {
    const engine = createAudioEngine();
    await engine.initialize();

    let resume: () => void = () => {};
    fakeContext.state = 'suspended';
    (fakeContext as unknown as { resume: () => Promise<void> }).resume = () =>
      new Promise<void>((settle) => {
        resume = () => settle();
      });

    const onStep = vi.fn();
    engine.playArpeggio({ notes: ['D3', 'E3'], bpm: 120, onStep });

    engine.stopArpeggio();
    resume();
    await Promise.resolve();
    vi.advanceTimersByTime(stepMs(120) * 3);

    expect(onStep).not.toHaveBeenCalled();
  });

  it('leaves the other instance playable when one is disposed', async () => {
    const discarded = createAudioEngine();
    const kept = createAudioEngine();
    await discarded.initialize();
    await kept.initialize();

    const [discardedVoice, keptVoice] = FakePolySynth.instances;

    discarded.dispose();

    expect(discardedVoice.disposed).toBe(true);
    expect(discarded.isInitialized()).toBe(false);
    expect(keptVoice.disposed).toBe(false);
    expect(kept.isInitialized()).toBe(true);

    kept.playNote('A3', 500);
    expect(keptVoice.triggered).toHaveLength(1);
  });

  /**
   * A widget can unmount while `initialize` is still awaiting the module or the
   * audio context — a pad tapped, then the page navigated away from. Disposal
   * has nothing to release at that moment, so the pending initialisation must
   * not go on to build a voice: nothing would ever dispose it, and it would
   * stay wired to the output for the life of the page.
   */
  it.each([
    ['the module is still loading', moduleGate],
    ['the audio context is still starting', contextGate],
  ])('builds no synth when disposed while %s', async (_label, gate) => {
    gate.hold = true;
    const engine = createAudioEngine();
    const pending = engine.initialize();
    await gate.entered;

    engine.dispose();
    gate.open();
    await pending;

    expect(engine.isInitialized()).toBe(false);
    expect(
      FakePolySynth.instances.filter((voice) => !voice.disposed)
    ).toHaveLength(0);
  });

  /**
   * The audio context belongs to the page, not to this widget. Resuming it on
   * behalf of an instance that has already gone away would start sound for
   * something with no way to stop it.
   */
  it('does not start the page audio context for a disposed instance', async () => {
    moduleGate.hold = true;
    const engine = createAudioEngine();
    const pending = engine.initialize();
    await moduleGate.entered;

    engine.dispose();
    moduleGate.open();
    await pending;

    expect(contextGate.calls).toBe(0);
  });

  /**
   * The same rule as `startAudioContext`, one level down.
   *
   * A cold module load can outlast the activation of the click that began it,
   * leaving the context resume pending for its full timeout. A second click on
   * the *same* widget is a fresh activation and must get a real attempt — an
   * in-flight initialisation that is stuck waiting on the first one's dead
   * activation would otherwise swallow it, and neither scale nor chord playback
   * retries.
   */
  it('lets a second gesture start the context while the first is stuck', async () => {
    contextGate.hold = true;
    const engine = createAudioEngine();
    const stuck = engine.initialize().catch((error) => error);
    await contextGate.entered;
    expect(contextGate.calls).toBe(1);

    // The visitor clicks again; this activation is live.
    contextGate.hold = false;
    await engine.initialize();

    expect(contextGate.calls).toBe(2);
    expect(engine.isInitialized()).toBe(true);
    expect(() => engine.playNote('D3')).not.toThrow();

    contextGate.open();
    await stuck;
  });

  it('still initialises after a disposal that interrupted one', async () => {
    contextGate.hold = true;
    const engine = createAudioEngine();
    const abandoned = engine.initialize();
    await contextGate.entered;
    engine.dispose();
    contextGate.open();
    await abandoned;

    contextGate.hold = false;
    await engine.initialize();

    expect(engine.isInitialized()).toBe(true);
    expect(() => engine.playNote('D3')).not.toThrow();
  });

  it('rebuilds after disposal rather than staying dead', async () => {
    const engine = createAudioEngine();
    await engine.initialize();
    engine.dispose();

    await engine.initialize();

    expect(engine.isInitialized()).toBe(true);
    expect(FakePolySynth.instances).toHaveLength(2);
    expect(() => engine.playNote('D3')).not.toThrow();
  });
});
