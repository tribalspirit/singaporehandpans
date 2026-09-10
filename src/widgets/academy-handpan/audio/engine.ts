/**
 * Tone.js is loaded on demand rather than imported statically.
 *
 * It is by far the heaviest dependency in this widget, and none of it is
 * needed until the visitor actually asks for sound. Browser autoplay policy
 * already forces initialisation behind a user gesture, so the dynamic import
 * costs nothing extra in practice while keeping Tone out of the page's initial
 * JavaScript. `import type` is erased at build time and adds no runtime cost.
 */
import type * as ToneModule from 'tone';
import { waitForRunningContext } from './waitForRunning';

let Tone: typeof ToneModule | null = null;
let isInitialized = false;
let synth: ToneModule.PolySynth | null = null;
let initializationPromise: Promise<void> | null = null;
let warmPromise: Promise<unknown> | null = null;

/**
 * The loaded Tone module. Throws if audio has not been initialised, which is
 * the same precondition every playback function here already enforces.
 */
export function getTone(): typeof ToneModule {
  if (!Tone) {
    throw new Error('Audio not initialized. Call initializeAudio() first.');
  }
  return Tone;
}

/**
 * The loaded Tone module, or null if audio has never been initialised.
 *
 * Teardown and status helpers run on mount and on scale changes — before the
 * visitor has made any gesture — so they must not demand that Tone be present.
 * With nothing loaded there is by definition nothing playing to stop.
 */
export function peekTone(): typeof ToneModule | null {
  return Tone;
}

/**
 * Load the Tone module without touching the audio context.
 *
 * Keeping Tone out of the initial bundle means the first gesture would
 * otherwise have to wait for a ~340 KB download before it can resume the audio
 * context — and a browser's user activation can expire in the meantime, which
 * on stricter engines leaves audio blocked.
 *
 * Calling this on pointerdown, before the click completes, gives the download a
 * head start while costing nothing for visitors who never play anything. Safe
 * to call repeatedly: the import is cached and the promise is shared.
 */
export function warmAudioModule(): Promise<unknown> {
  if (Tone) {
    return Promise.resolve(Tone);
  }
  if (!warmPromise) {
    warmPromise = import('tone')
      .then((module) => {
        Tone = module;
        return module;
      })
      .catch((error) => {
        // Drop the rejected promise so a later gesture can retry. Caching it
        // would hand the same rejection to every subsequent call — the pointer
        // handler swallows it, so audio would simply never work again until
        // reload. Same permanent-failure shape as the unbounded start poll.
        warmPromise = null;
        throw error;
      });
  }
  return warmPromise;
}

export async function initializeAudio(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise;
  }

  if (isInitialized && synth && Tone && Tone.context.state === 'running') {
    return;
  }

  initializationPromise = (async () => {
    try {
      if (!Tone) {
        await warmAudioModule();
      }
      // Local binding so the closures below narrow past the mutable module ref.
      const tone = Tone;

      if (
        tone.context.state === 'suspended' ||
        tone.context.state === 'closed'
      ) {
        isInitialized = false;
        if (synth) {
          synth.dispose();
          synth = null;
        }
      }

      await tone.start();

      // Bounded: an unbounded poll here never settled when the context refused
      // to start, which left `initializationPromise` pending forever and killed
      // audio until reload. Failing instead makes the next gesture retry, and by
      // then the module is cached so the slow path is gone.
      const started = await waitForRunningContext(() => tone.context.state);

      if (!started) {
        throw new Error(
          `Audio context failed to start. State: ${tone.context.state}`
        );
      }

      if (synth) {
        synth.dispose();
      }

      synth = new tone.PolySynth(tone.Synth, {
        oscillator: {
          type: 'sine',
        },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.3,
          release: 0.5,
        },
      }).toDestination();

      isInitialized = true;
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

export function isAudioInitialized(): boolean {
  return isInitialized;
}

export function playNote(note: string, durationMs: number = 500): void {
  if (!isInitialized || !synth) {
    throw new Error('Audio not initialized. Call initializeAudio() first.');
  }

  const Tone = getTone();

  if (Tone.context.state === 'suspended') {
    Tone.context.resume().then(() => {
      if (synth) {
        const duration = Tone.Time(durationMs / 1000).toSeconds();
        synth.triggerAttackRelease(note, duration);
      }
    });
    return;
  }

  if (Tone.context.state !== 'running') {
    throw new Error(`Audio context not running. State: ${Tone.context.state}`);
  }

  const duration = Tone.Time(durationMs / 1000).toSeconds();
  synth.triggerAttackRelease(note, duration);
}

export function playChord(notes: string[], durationMs: number = 1000): void {
  if (!isInitialized || !synth) {
    throw new Error('Audio not initialized. Call initializeAudio() first.');
  }

  const Tone = getTone();

  if (Tone.context.state === 'suspended') {
    Tone.context.resume().then(() => {
      if (synth) {
        const duration = Tone.Time(durationMs / 1000).toSeconds();
        synth.triggerAttackRelease(notes, duration);
      }
    });
    return;
  }

  const duration = Tone.Time(durationMs / 1000).toSeconds();
  synth.triggerAttackRelease(notes, duration);
}

export function playArpeggio(
  notes: string[],
  noteDurationMs: number = 200,
  startTime?: number
): void {
  if (!isInitialized || !synth) {
    throw new Error('Audio not initialized. Call initializeAudio() first.');
  }

  const Tone = getTone();

  const playNotes = () => {
    if (!synth) return;
    const duration = Tone.Time(noteDurationMs / 1000).toSeconds();
    const start =
      startTime !== undefined ? Tone.Time(startTime).toSeconds() : Tone.now();

    notes.forEach((note, index) => {
      const time = start + index * duration;
      synth?.triggerAttackRelease(note, duration, time);
    });
  };

  if (Tone.context.state === 'suspended') {
    Tone.context.resume().then(playNotes);
    return;
  }

  playNotes();
}

export function stopAll(): void {
  if (synth) {
    synth.releaseAll();
  }
}

export function dispose(): void {
  if (synth) {
    synth.dispose();
    synth = null;
  }
  isInitialized = false;
}
