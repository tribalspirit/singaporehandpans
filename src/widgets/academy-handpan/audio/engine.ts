/**
 * The page-wide half of the audio stack: loading Tone, and starting the one
 * audio context the browser gives us.
 *
 * Both are genuinely shared. A page may hold several widgets, but there is only
 * ever one `tone` module to import and one `AudioContext` to resume — browsers
 * cap how many a document may create, and resuming twice buys nothing. What is
 * *not* shared lives in `createAudioEngine.ts`: a synth, its initialisation
 * state, and whatever that instance is currently playing.
 *
 * Tone.js is loaded on demand rather than imported statically. It is by far the
 * heaviest dependency in this widget, and none of it is needed until the visitor
 * actually asks for sound. Browser autoplay policy already forces initialisation
 * behind a user gesture, so the dynamic import costs nothing extra in practice
 * while keeping Tone out of the page's initial JavaScript. `import type` is
 * erased at build time and adds no runtime cost.
 */
import type * as ToneModule from 'tone';
import {
  CONTEXT_START_TIMEOUT_MS,
  waitForRunningContext,
  withTimeout,
} from './waitForRunning';

/** A cold module fetch on a slow connection, bounded so it cannot hang. */
const MODULE_LOAD_TIMEOUT_MS = 15000;

let Tone: typeof ToneModule | null = null;
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

/** `warmAudioModule`, bounded, resolving to the module itself. */
export async function loadToneModule(): Promise<typeof ToneModule> {
  if (Tone) {
    return Tone;
  }
  await withTimeout(
    warmAudioModule(),
    MODULE_LOAD_TIMEOUT_MS,
    'Loading the audio engine'
  );
  return getTone();
}

/**
 * Resume the page's audio context.
 *
 * The context is shared — a document gets one, and resuming a running context
 * buys nothing, which is what the state check above skips. The *attempt* is
 * deliberately not shared. `tone.start()` resolves only when the underlying
 * `AudioContext.resume()` does, and a resume made without a live user
 * activation can sit pending until the bound below fires. Handing that stuck
 * promise to the next widget would spend its perfectly good gesture on the
 * first widget's dead one and fail them both; every gesture gets its own
 * attempt instead. Concurrent `resume()` calls are harmless.
 */
export async function startAudioContext(): Promise<void> {
  const tone = getTone();

  if (tone.context.state === 'running') {
    return;
  }

  // Bounded, because `tone.start()` can stay pending indefinitely under
  // autoplay policy. Bounding only the state poll below was not enough:
  // execution never reached it, so the caller's initialisation promise stayed
  // pending forever and every later gesture reused the stuck promise — exactly
  // the failure the poll's bound was meant to remove.
  await withTimeout(
    tone.start(),
    CONTEXT_START_TIMEOUT_MS,
    'Starting the audio context'
  );

  // Bounded for the same reason: a context that never reaches `running` must
  // fail rather than poll forever, so the next gesture can retry against a
  // module that is by then cached.
  const started = await waitForRunningContext(() => tone.context.state);

  if (!started) {
    throw new Error(
      `Audio context failed to start. State: ${tone.context.state}`
    );
  }
}
