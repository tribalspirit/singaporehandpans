import { useCallback, useEffect, useRef } from 'react';
import { usePlayback } from './usePlayback';
import {
  initializeAudio,
  isAudioInitialized,
  playChord,
  playNote,
} from '../audio/engine';
import type { PlaybackMode } from './types';
import { playArpeggio, stopArpeggio } from '../audio/scheduler';

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

  const playSingleNote = useCallback(async (noteName: string) => {
    const sound = () => {
      onBeforePlayRef.current?.();
      setNoteActiveRef.current(noteName, 'note');
      playNote(noteName, NOTE_DURATION_MS);
      setTimeout(() => clearPlaybackRef.current(), NOTE_DURATION_MS);
    };

    try {
      if (!isAudioInitialized()) {
        await initializeAudio();
      }
      sound();
    } catch (error) {
      // One retry: the first gesture can land while Tone is still loading, and
      // initialising again on the user's activation usually succeeds.
      try {
        await initializeAudio();
        sound();
      } catch (retryError) {
        console.error('Failed to play note', noteName, retryError);
        clearPlaybackRef.current();
      }
    }
  }, []);

  /**
   * `shouldProceed` is consulted after the audio module has loaded and before
   * anything is scheduled. Loading can take long enough for the caller's
   * request to be superseded — a different scale chosen meanwhile — and
   * without this check the resolved call would play the old one over the new
   * instrument.
   */
  const playScale = useCallback(
    async (notes: string[], shouldProceed?: () => boolean) => {
      if (notes.length === 0) {
        return;
      }
      try {
        if (!isAudioInitialized()) {
          await initializeAudio();
        }
        if (shouldProceed && !shouldProceed()) {
          return;
        }
        stopArpeggio();
        onBeforePlayRef.current?.();
        setIsPlayingRef.current(true);
        playArpeggio({
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
      } catch (error) {
        console.error('Failed to play scale', error);
        clearPlaybackRef.current();
      }
    },
    []
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
      try {
        if (!isAudioInitialized()) {
          await initializeAudio();
        }
        stopArpeggio();
        setIsPlayingRef.current(true);

        if (mode === 'simultaneous') {
          setChordNotesActiveRef.current(notes);
          playChord(notes, CHORD_DURATION_MS);
          setTimeout(() => clearPlaybackRef.current(), CHORD_DURATION_MS);
          return;
        }

        playArpeggio({
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
        clearPlaybackRef.current();
      }
    },
    []
  );

  const stop = useCallback(() => {
    stopArpeggio();
    clearPlaybackRef.current();
  }, []);

  return { playSingleNote, playScale, playChordNotes, stop };
}
