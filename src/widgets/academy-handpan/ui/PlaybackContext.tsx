import React, {
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { PlaybackState } from './types';
import { PlaybackContext, type PlaybackContextValue } from './usePlayback';

export const PlaybackProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<PlaybackState>({
    intent: 'none',
    activeNote: null,
    activePitchClasses: null,
    isPlaying: false,
  });

  const setNoteActive = useCallback((note: string, intent: 'note' | 'scalePlayback') => {
    setState({
      intent,
      activeNote: note,
      activePitchClasses: null,
      isPlaying: intent === 'scalePlayback',
    });
  }, []);

  const setChordPitchClassesActive = useCallback((pcs: string[]) => {
    setState({
      intent: 'chordPlayback',
      activeNote: null,
      activePitchClasses: pcs,
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
      isPlaying: false,
    });
  }, []);

  const contextValue = useMemo<PlaybackContextValue>(
    () => ({
      state,
      setNoteActive,
      setChordPitchClassesActive,
      setIsPlaying,
      clearPlayback,
    }),
    [
      state,
      setNoteActive,
      setChordPitchClassesActive,
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
