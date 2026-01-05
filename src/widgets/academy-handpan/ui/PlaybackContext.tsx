import React, { useState, useCallback, useMemo } from 'react';
import type { PlaybackState } from './types';
import { PlaybackContext, type PlaybackContextValue } from './usePlayback';

export const PlaybackProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<PlaybackState>({
    intent: 'none',
    activeNote: null,
    activePitchClasses: null,
    activeNotes: null,
    isPlaying: false,
  });

  const setNoteActive = useCallback(
    (note: string, intent: 'note' | 'scalePlayback') => {
      setState({
        intent,
        activeNote: note,
        activePitchClasses: null,
        activeNotes: null,
        isPlaying: intent === 'scalePlayback',
      });
    },
    []
  );

  const setChordPitchClassesActive = useCallback((pcs: string[]) => {
    setState({
      intent: 'chordPlayback',
      activeNote: null,
      activePitchClasses: pcs,
      activeNotes: null,
      isPlaying: true,
    });
  }, []);

  const setChordNotesActive = useCallback((notes: string[]) => {
    setState({
      intent: 'chordPlayback',
      activeNote: null,
      activePitchClasses: null,
      activeNotes: notes,
      isPlaying: true,
    });
  }, []);

  const setIsPlaying = useCallback((playing: boolean) => {
    setState((prev) => ({ ...prev, isPlaying: playing }));
  }, []);

  const clearPlayback = useCallback(() => {
    setState({
      intent: 'none',
      activeNote: null,
      activePitchClasses: null,
      activeNotes: null,
      isPlaying: false,
    });
  }, []);

  const contextValue = useMemo<PlaybackContextValue>(
    () => ({
      state,
      setNoteActive,
      setChordPitchClassesActive,
      setChordNotesActive,
      setIsPlaying,
      clearPlayback,
    }),
    [
      state,
      setNoteActive,
      setChordPitchClassesActive,
      setChordNotesActive,
      setIsPlaying,
      clearPlayback,
    ]
  );

  return (
    <PlaybackContext.Provider value={contextValue}>
      {children}
    </PlaybackContext.Provider>
  );
};
