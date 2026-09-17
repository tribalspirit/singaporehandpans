/**
 * One playable instrument, owned by one widget.
 *
 * Everything here used to be module-level: a single synth, a single
 * `isInitialized` flag, a single in-flight arpeggio, and `Tone.Transport` —
 * which is global to the page. Two widgets on one page therefore shared a
 * voice, and whichever one stopped last stopped both: `stopArpeggio()` called
 * `Transport.stop()` and `Transport.cancel()`, tearing down the other widget's
 * scheduled events and its step callbacks with them. Setting the tempo had the
 * same reach — `Transport.bpm` is one value for the document.
 *
 * So an instance owns its synth and its timeline, and the page-wide facts
 * (the loaded module, the audio context) stay in `engine.ts` where sharing is
 * correct.
 */
import type * as ToneModule from 'tone';
import { getTone, loadToneModule, peekTone, startAudioContext } from './engine';
import { normalizeToPitchClass } from '../theory/normalize';

export type ArpeggioDirection = 'up' | 'down' | 'updown';

export interface PlaybackStep {
  note: string; // e.g. 'D4'
  pitchClass: string; // e.g. 'D'
  index: number;
}

export interface ArpeggioOptions {
  notes: string[];
  bpm: number;
  direction?: ArpeggioDirection;
  onStep?: (step: PlaybackStep) => void;
  onComplete?: () => void;
}

export interface AudioEngine {
  /** Load Tone, resume the context, and build this instance's synth. */
  initialize(): Promise<void>;
  isInitialized(): boolean;
  playNote(note: string, durationMs?: number): void;
  playChord(notes: string[], durationMs?: number): void;
  /** Roll `notes` one at a time, replacing anything this instance is playing. */
  playArpeggio(options: ArpeggioOptions): void;
  stopArpeggio(): void;
  /** Release this instance's synth. The audio context is left alone. */
  dispose(): void;
}

const SECONDS_PER_MINUTE = 60;

function getOrderedNotes(
  notes: string[],
  direction: ArpeggioDirection
): string[] {
  const ordered = [...notes];

  if (direction === 'down') {
    return ordered.reverse();
  } else if (direction === 'updown') {
    return [...ordered, ...ordered.slice(1, -1).reverse()];
  }

  return ordered;
}

export function createAudioEngine(): AudioEngine {
  let synth: ToneModule.PolySynth | null = null;
  let initialized = false;
  let initializationPromise: Promise<void> | null = null;

  let arpeggioTimers: ReturnType<typeof setTimeout>[] = [];
  /**
   * Bumped by every stop. An arpeggio that had to wait for the context to
   * resume checks it before scheduling anything, so a stop issued during that
   * wait is honoured rather than overtaken.
   */
  let arpeggioGeneration = 0;
  /**
   * Bumped by every disposal, for the same reason.
   *
   * `initialize` awaits the module and the audio context, and the widget can
   * unmount in that window — a pad tapped and the page navigated away from
   * before Tone finished downloading. Disposal then had nothing to release,
   * and the pending initialisation went on to build a `PolySynth` and wire it
   * to the destination anyway. Nothing would ever call `dispose` again, so
   * that voice stayed connected to the output for the life of the page.
   */
  let lifecycleGeneration = 0;

  function releaseSynth(): void {
    if (synth) {
      synth.dispose();
      synth = null;
    }
    initialized = false;
  }

  function requireSynth(): ToneModule.PolySynth {
    if (!initialized || !synth) {
      throw new Error('Audio not initialized. Call initializeAudio() first.');
    }
    return synth;
  }

  function initialize(): Promise<void> {
    if (initializationPromise) {
      return initializationPromise;
    }

    const loaded = peekTone();
    if (initialized && synth && loaded && loaded.context.state === 'running') {
      return Promise.resolve();
    }

    initializationPromise = (async () => {
      const generation = lifecycleGeneration;
      const superseded = () => generation !== lifecycleGeneration;

      try {
        const tone = await loadToneModule();
        if (superseded()) {
          return;
        }

        if (
          tone.context.state === 'suspended' ||
          tone.context.state === 'closed'
        ) {
          releaseSynth();
        }

        await startAudioContext();
        if (superseded()) {
          return;
        }

        releaseSynth();
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

        initialized = true;
      } finally {
        initializationPromise = null;
      }
    })();

    return initializationPromise;
  }

  function playNote(note: string, durationMs: number = 500): void {
    const voice = requireSynth();
    const tone = getTone();

    if (tone.context.state === 'suspended') {
      void tone.context.resume().then(() => {
        if (synth === voice) {
          voice.triggerAttackRelease(note, durationMs / 1000);
        }
      });
      return;
    }

    if (tone.context.state !== 'running') {
      throw new Error(
        `Audio context not running. State: ${tone.context.state}`
      );
    }

    voice.triggerAttackRelease(note, durationMs / 1000);
  }

  function playChord(notes: string[], durationMs: number = 1000): void {
    const voice = requireSynth();
    const tone = getTone();

    if (tone.context.state === 'suspended') {
      void tone.context.resume().then(() => {
        if (synth === voice) {
          voice.triggerAttackRelease(notes, durationMs / 1000);
        }
      });
      return;
    }

    if (tone.context.state !== 'running') {
      throw new Error(
        `Audio context not running. State: ${tone.context.state}`
      );
    }

    voice.triggerAttackRelease(notes, durationMs / 1000);
  }

  function stopArpeggio(): void {
    arpeggioGeneration += 1;
    arpeggioTimers.forEach((timer) => clearTimeout(timer));
    arpeggioTimers = [];
  }

  /**
   * Steps are driven by this instance's own timers rather than the page's
   * `Transport`, which is what makes two widgets independent. Each timer sounds
   * its note at the moment it fires, so stopping genuinely cancels what has not
   * played yet while a note already ringing is left to decay — the behaviour
   * the `Transport` version had, since it discarded the scheduled time and
   * triggered at `now` inside the callback too.
   */
  function playArpeggio(options: ArpeggioOptions): void {
    stopArpeggio();

    const { notes, bpm, direction = 'up', onStep, onComplete } = options;

    if (notes.length === 0) {
      return;
    }

    const tone = getTone();
    const generation = arpeggioGeneration;
    const ordered = getOrderedNotes(notes, direction);
    // A quarter note at `bpm` — what `Tone.Time('4n')` resolved to once the
    // Transport's tempo had been set to the same value.
    const stepMs = (SECONDS_PER_MINUTE / bpm) * 1000;

    const start = () => {
      if (generation !== arpeggioGeneration) {
        return;
      }

      ordered.forEach((note, index) => {
        arpeggioTimers.push(
          setTimeout(() => {
            try {
              playNote(note, stepMs);
            } catch {
              // Silently ignore playback errors
            }
            onStep?.({
              note,
              pitchClass: normalizeToPitchClass(note),
              index,
            });
          }, index * stepMs)
        );
      });

      arpeggioTimers.push(
        setTimeout(() => {
          arpeggioTimers = [];
          onComplete?.();
        }, ordered.length * stepMs)
      );
    };

    if (tone.context.state === 'suspended') {
      void tone.context.resume().then(start);
    } else {
      start();
    }
  }

  function dispose(): void {
    lifecycleGeneration += 1;
    stopArpeggio();
    releaseSynth();
  }

  return {
    initialize,
    isInitialized: () => initialized,
    playNote,
    playChord,
    playArpeggio,
    stopArpeggio,
    dispose,
  };
}
