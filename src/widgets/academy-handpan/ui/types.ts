export type HighlightIntent =
  'none' | 'note' | 'scalePlayback' | 'chordPlayback';

export type PlaybackState = {
  intent: HighlightIntent;
  activeNote: string | null;
  activePitchClasses: string[] | null;
  activeNotes: string[] | null;
  isPlaying: boolean;
};

/**
 * How a selected chord is sounded. Lives here rather than on ChordsSection:
 * the chord list is now only a picker, and the setting belongs to the action
 * bar that plays it.
 */
export type PlaybackMode = 'simultaneous' | 'arpeggio';
