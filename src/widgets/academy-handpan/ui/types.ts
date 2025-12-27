export type PlaybackState = {
  activePitchClass: string | null; // e.g. 'D'
  activeNote: string | null;       // e.g. 'D4' (optional, for audio)
  isPlaying: boolean;
};

