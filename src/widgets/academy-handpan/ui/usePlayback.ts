import { useContext, createContext } from 'react';
import type { PlaybackState } from './types';

export interface PlaybackContextValue {
  state: PlaybackState;
  setNoteActive: (note: string, intent: 'note' | 'scalePlayback') => void;
  setChordPitchClassesActive: (pcs: string[]) => void;
  setChordNotesActive: (notes: string[]) => void;
  setIsPlaying: (playing: boolean) => void;
  clearPlayback: () => void;
}

export const PlaybackContext = createContext<PlaybackContextValue | undefined>(
  undefined
);

export const usePlayback = () => {
  const ctx = useContext(PlaybackContext);
  if (ctx === undefined) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return ctx;
};
