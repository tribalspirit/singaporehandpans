export type PlaybackState = {
  activePadNote: string | null;          // exact pad note to highlight (D4) - for single-note interactions
  activePitchClasses: string[] | null;  // conceptual highlight set (Dm => ['D','F','A']) - for chord/conceptual highlights
  isPlaying: boolean;
};

