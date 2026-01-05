export type HighlightIntent =
  | 'none'
  | 'note'
  | 'scalePlayback'
  | 'chordPlayback';

export type PlaybackState = {
  intent: HighlightIntent;
  activeNote: string | null;
  activePitchClasses: string[] | null;
  activeNotes: string[] | null;
  isPlaying: boolean;
};
