import { useCallback, useEffect, useRef } from 'react';
import { usePlayback } from './usePlayback';
import {
  createAudioEngine,
  type AudioEngine,
} from '../audio/createAudioEngine';
import type { PlaybackMode } from './types';

const NOTE_DURATION_MS = 500;
const CHORD_DURATION_MS = 1000;
const SCALE_PREVIEW_BPM = 120;

interface UseScaleAudioOptions {
  /** Called before any sound starts, to clear a selection the sound replaces. */
  onBeforePlay?: () => void;
}

/**
 * Playing single notes and whole scales.
 *
 * The widget and the scale panel each carried their own copy of this — the
 * same initialise-retry-highlight-clear sequence, written twice and drifting.
 * Promoting Play out of the scale panel would have made it three.
 *
 * Every callback is stable across renders: the changing values are read
 * through refs, so passing these to a pad or a note badge does not re-render
 * the row on every playback tick.
 */
export function useScaleAudio({ onBeforePlay }: UseScaleAudioOptions = {}) {
  const { setNoteActive, setChordNotesActive, setIsPlaying, clearPlayback } =
    usePlayback();

  /**
   * One instrument per mount. Two widgets on a page each get their own synth
   * and their own timeline, so neither can silence or re-tempo the other.
   *
   * Built on first render — the constructor only allocates closures, and does
   * not reach for Tone or the audio context — so `stop` has something to call
   * before anything has ever played. Disposing on unmount releases the synth
   * but leaves the object usable: a later `initialize` rebuilds it, which is
   * what makes StrictMode's mount-unmount-mount harmless.
   */
  const engineRef = useRef<AudioEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = createAudioEngine();
  }
  const engine = engineRef.current;

  /**
   * Whether the widget this engine belongs to is still on the page.
   *
   * Every playback path awaits `initialize`, and the visitor can navigate away
   * mid-await. Disposal on unmount stops what is already sounding, but a
   * disposed engine rebuilds on the next `initialize` — deliberately, so
   * StrictMode's mount/unmount/mount is harmless — so anything still holding
   * one can bring a `PolySynth` back to life after its widget is gone, wire it
   * to the output, and sound a note over the next page with nothing left to
   * dispose it.
   */
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      engine.dispose();
    };
  }, [engine]);

  /**
   * Supersedes an exclusive playback request that is still waiting on audio.
   *
   * Scale and chord playback are exclusive: starting one replaces whatever was
   * sounding. Each gesture now gets its own initialisation attempt, so two can
   * settle out of order — the later request starts, the earlier one then wakes
   * up, stops it and plays itself, while the UI still highlights the later one.
   *
   * Every exclusive path takes a ticket on the way in and checks it is still
   * the current one after each await; `stop` invalidates whatever is pending,
   * so an explicit stop is not undone by a request made before it. Single notes
   * deliberately do not take part: tapping two pads should sound two notes, not
   * cancel the first.
   */
  const playbackGenerationRef = useRef(0);

  const beginExclusivePlayback = useCallback((): number => {
    playbackGenerationRef.current += 1;
    return playbackGenerationRef.current;
  }, []);

  const isCurrentPlayback = useCallback(
    (generation: number): boolean =>
      isMountedRef.current && playbackGenerationRef.current === generation,
    []
  );

  const onBeforePlayRef = useRef(onBeforePlay);
  const setNoteActiveRef = useRef(setNoteActive);
  const setChordNotesActiveRef = useRef(setChordNotesActive);
  const setIsPlayingRef = useRef(setIsPlaying);
  const clearPlaybackRef = useRef(clearPlayback);

  useEffect(() => {
    onBeforePlayRef.current = onBeforePlay;
    setNoteActiveRef.current = setNoteActive;
    setChordNotesActiveRef.current = setChordNotesActive;
    setIsPlayingRef.current = setIsPlaying;
    clearPlaybackRef.current = clearPlayback;
  }, [
    onBeforePlay,
    setNoteActive,
    setChordNotesActive,
    setIsPlaying,
    clearPlayback,
  ]);

  const playSingleNote = useCallback(
    async (noteName: string) => {
      // A note takes no ticket — two pads tapped together should sound
      // together — but it must still not tidy up after playback that started
      // while it was waiting, which is what the generation is read for here.
      const generationAtStart = playbackGenerationRef.current;
      const canClearOwnPlayback = () =>
        isMountedRef.current &&
        playbackGenerationRef.current === generationAtStart;

      const sound = () => {
        onBeforePlayRef.current?.();
        setNoteActiveRef.current(noteName, 'note');
        engine.playNote(noteName, NOTE_DURATION_MS);
        setTimeout(() => clearPlaybackRef.current(), NOTE_DURATION_MS);
      };

      try {
        if (!engine.isInitialized()) {
          await engine.initialize();
          if (!isMountedRef.current) {
            return;
          }
        }
        sound();
      } catch (error) {
        // One retry: the first gesture can land while Tone is still loading,
        // and initialising again on the user's activation usually succeeds.
        // Not once the widget has gone, though — retrying there would rebuild
        // the engine that unmounting just disposed.
        if (!isMountedRef.current) {
          return;
        }
        try {
          await engine.initialize();
          if (!isMountedRef.current) {
            return;
          }
          sound();
        } catch (retryError) {
          console.error('Failed to play note', noteName, retryError);
          if (canClearOwnPlayback()) {
            clearPlaybackRef.current();
          }
        }
      }
    },
    [engine]
  );

  /**
   * `shouldProceed` is consulted after the audio module has loaded and before
   * anything is scheduled. Loading can take long enough for the caller's
   * request to be superseded — a different scale chosen meanwhile — and
   * without this check the resolved call would play the old one over the new
   * instrument.
   *
   * Returns whether playback actually began. A caller that lit up a control on
   * the way in needs to know when nothing started, because on the failure path
   * `isPlaying` never goes true and so never transitions back to false — the
   * control would stay lit forever over silence.
   */
  const playScale = useCallback(
    async (
      notes: string[],
      shouldProceed?: () => boolean
    ): Promise<boolean> => {
      if (notes.length === 0) {
        return false;
      }
      const generation = beginExclusivePlayback();
      try {
        if (!engine.isInitialized()) {
          await engine.initialize();
        }
        if (!isCurrentPlayback(generation)) {
          return false;
        }
        if (shouldProceed && !shouldProceed()) {
          return false;
        }
        engine.stopArpeggio();
        onBeforePlayRef.current?.();
        setIsPlayingRef.current(true);
        engine.playArpeggio({
          notes,
          bpm: SCALE_PREVIEW_BPM,
          direction: 'up',
          onStep: (step) => {
            setNoteActiveRef.current(step.note, 'scalePlayback');
          },
          onComplete: () => {
            clearPlaybackRef.current();
          },
        });
        return true;
      } catch (error) {
        console.error('Failed to play scale', error);
        // Only tidy up if this request is still the current one. A rejection
        // jumps straight here, past the check above, so an older attempt
        // failing after a newer one began would otherwise clear the newer
        // one's highlights and unlight its control over sound still playing.
        if (isCurrentPlayback(generation)) {
          clearPlaybackRef.current();
        }
        return false;
      }
    },
    [engine, beginExclusivePlayback, isCurrentPlayback]
  );

  /**
   * Sound a chord, either rolled one note at a time or struck together.
   *
   * `onBeforePlay` is deliberately not called here: it clears the chord
   * selection, and the chord being played is the selection.
   */
  const playChordNotes = useCallback(
    async (notes: string[], mode: PlaybackMode, bpm: number) => {
      if (notes.length === 0) {
        return;
      }
      const generation = beginExclusivePlayback();
      try {
        if (!engine.isInitialized()) {
          await engine.initialize();
        }
        if (!isCurrentPlayback(generation)) {
          return;
        }
        engine.stopArpeggio();
        setIsPlayingRef.current(true);

        if (mode === 'simultaneous') {
          setChordNotesActiveRef.current(notes);
          engine.playChord(notes, CHORD_DURATION_MS);
          setTimeout(() => clearPlaybackRef.current(), CHORD_DURATION_MS);
          return;
        }

        engine.playArpeggio({
          notes,
          bpm,
          direction: 'up',
          onStep: (step) => {
            setChordNotesActiveRef.current([step.note]);
          },
          onComplete: () => {
            clearPlaybackRef.current();
          },
        });
      } catch (error) {
        console.error('Failed to play chord', error);
        // See `playScale`: a stale rejection must not tidy up after the live
        // request.
        if (isCurrentPlayback(generation)) {
          clearPlaybackRef.current();
        }
      }
    },
    [engine, beginExclusivePlayback, isCurrentPlayback]
  );

  const stop = useCallback(() => {
    // Invalidates anything still waiting on audio, so a request made before
    // the stop cannot start sounding after it.
    beginExclusivePlayback();
    engine.stopArpeggio();
    clearPlaybackRef.current();
  }, [engine, beginExclusivePlayback]);

  return { playSingleNote, playScale, playChordNotes, stop };
}
